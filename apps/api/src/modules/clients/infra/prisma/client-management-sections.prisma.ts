import type { Prisma } from '@prisma/client';
import {
  buildDefaultClientManagementSections,
  CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER,
  isClientManagementSectionCode,
  type ClientManagementSection,
} from '../../domain/client-management-section';

export async function listClientManagementSections(
  tx: Prisma.TransactionClient,
  clientId: string,
): Promise<ClientManagementSection[]> {
  await seedMissingClientManagementSections(tx, clientId);
  const rows = await tx.clientManagementSection.findMany({
    orderBy: [{ archived: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
    where: { clientId },
  });
  return rows.map(toSection).filter(isDefined);
}

export async function replaceClientManagementSections(
  tx: Prisma.TransactionClient,
  clientId: string,
  items: ClientManagementSection[],
): Promise<ClientManagementSection[]> {
  const normalized = normalizeSections(items);
  await tx.clientManagementSection.deleteMany({ where: { clientId } });
  await tx.clientManagementSection.createMany({
    data: normalized.map((item) => ({
      archived: item.archived,
      clientId,
      code: item.code,
      sortOrder: item.sortOrder,
    })),
  });
  return normalized;
}

export async function seedMissingClientManagementSections(
  tx: Prisma.TransactionClient,
  clientId: string,
): Promise<void> {
  const existing = await tx.clientManagementSection.findMany({
    select: { code: true },
    where: { clientId },
  });
  const currentCodes = new Set(existing.map((item) => item.code));
  const missing = buildDefaultClientManagementSections().filter(
    (item) => !currentCodes.has(item.code),
  );
  if (missing.length === 0) return;
  await tx.clientManagementSection.createMany({
    data: missing.map((item) => ({
      archived: item.archived,
      clientId,
      code: item.code,
      sortOrder: item.sortOrder,
    })),
  });
}

function normalizeSections(items: ClientManagementSection[]): ClientManagementSection[] {
  const map = new Map<string, ClientManagementSection>();
  for (const item of items) {
    if (!isClientManagementSectionCode(item.code)) continue;
    if (map.has(item.code)) continue;
    map.set(item.code, item);
  }
  const completed = CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER.map(
    (code, index) => map.get(code) ?? { archived: false, code, sortOrder: 100 + index },
  );
  return completed
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

function toSection(item: {
  archived: boolean;
  code: string;
  sortOrder: number;
}): ClientManagementSection | undefined {
  if (!isClientManagementSectionCode(item.code)) return undefined;
  return {
    archived: item.archived,
    code: item.code,
    sortOrder: item.sortOrder,
  };
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
