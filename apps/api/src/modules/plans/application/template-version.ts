import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertExpectedTemplateVersion } from './template-save.policy';

export async function advanceTemplateVersion(
  tx: Prisma.TransactionClient,
  templateId: string,
  expected: number | undefined,
  current: number,
): Promise<void> {
  assertExpectedTemplateVersion(expected, current);
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
