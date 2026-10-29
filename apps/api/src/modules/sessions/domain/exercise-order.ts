import { NotFoundException } from '@nestjs/common';

export function readExerciseOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

export function appendExerciseOrder(current: unknown, itemId: string): string[] {
  const order = readExerciseOrder(current);
  if (order.includes(itemId)) return order;
  return [...order, itemId];
}

export function completionOrderFor(order: readonly string[], itemId: string): number | null {
  const index = order.indexOf(itemId);
  return index >= 0 ? index + 1 : null;
}

export function nextExerciseOrder(current: unknown, itemId: string, belongsToSession: boolean): string[] {
  if (!belongsToSession) throw new NotFoundException('Session item not found');
  return appendExerciseOrder(current, itemId);
}

export function stampCompletionOrder<T extends { id: string }>(
  items: T[],
  raw: unknown,
): Array<T & { completionOrder: number | null }> {
  const order = readExerciseOrder(raw);
  return items.map((item) => ({ ...item, completionOrder: completionOrderFor(order, item.id) }));
}
