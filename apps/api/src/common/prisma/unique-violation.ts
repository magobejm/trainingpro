import { Prisma } from '@prisma/client';

export function isUniqueViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return true;
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function createOrReread<T>(write: () => Promise<T>, reread: () => Promise<T | null>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await reread();
    if (!existing) throw error;
    return existing;
  }
}

export async function writeOrUpdate<T>(write: () => Promise<T>, update: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return update();
  }
}
