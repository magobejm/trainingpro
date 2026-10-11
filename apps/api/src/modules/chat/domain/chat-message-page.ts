export function ascendingByCreatedAt<T extends { createdAt: Date }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
}
