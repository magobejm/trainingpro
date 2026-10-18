import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertExpectedTemplateVersion } from './template-save.policy';
import { captureLegacyAssignments } from '../infra/prisma/routine-revision.prisma';

export async function advanceTemplateVersion(
  tx: Prisma.TransactionClient,
  templateId: string,
  expected: number | undefined,
  current: number,
): Promise<void> {
  assertExpectedTemplateVersion(expected, current);
  await tx.$queryRaw`SELECT id FROM plan_template WHERE id = ${templateId}::uuid FOR UPDATE`;
  const locked = await tx.planTemplate.findFirst({
    where: { id: templateId, archivedAt: null },
    select: { templateVersion: true },
  });
  assertExpectedTemplateVersion(current, locked?.templateVersion ?? current);
  await captureLegacyAssignments(tx, templateId);
  const updated = await tx.planTemplate.updateMany({
    where: {
      archivedAt: null,
      id: templateId,
      ...(expected != null ? { templateVersion: expected } : {}),
    },
    data: { templateVersion: { increment: 1 } },
  });
  if (expected == null || updated.count > 0) return;
  const fresh = await tx.planTemplate.findFirst({
    where: { id: templateId },
    select: { templateVersion: true },
  });
  throw new ConflictException({
    message: 'A newer template save already exists',
    templateVersion: fresh?.templateVersion ?? current,
  });
}
