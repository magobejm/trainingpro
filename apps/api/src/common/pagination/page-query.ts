import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const PAGE_LIMIT_MAX = 50;

export const pageFieldsSchema = {
  cursor: z.string().trim().min(1).max(400).optional(),
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).optional(),
};

export type PageCursor = {
  id: string;
  sort: string;
};

export type PageDirection = 'asc' | 'desc';

export type PageSlice<T> = {
  items: T[];
  nextCursor?: string | null;
};

export function encodePageCursor(cursor: PageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodePageCursor(value: string): PageCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<PageCursor>;
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.sort !== 'string') {
      throw new Error('invalid');
    }
    return { id: parsed.id, sort: parsed.sort };
  } catch {
    throw new BadRequestException('cursor: invalid');
  }
}

export function orderByKey<T>(
  items: T[],
  read: { direction: PageDirection; id: (item: T) => string; sort: (item: T) => string },
): T[] {
  const factor = read.direction === 'asc' ? 1 : -1;
  return [...items].sort((left, right) => compareItems(left, right, read, factor));
}

export function slicePage<T>(
  items: T[],
  input: { cursor?: string; limit?: number },
  read: { direction: PageDirection; id: (item: T) => string; sort: (item: T) => string },
): PageSlice<T> {
  if (!input.limit) return { items };
  const ordered = orderByKey(items, read);
  const cursor = input.cursor ? decodePageCursor(input.cursor) : null;
  const start = cursor ? offsetAfter(ordered, cursor, read) : 0;
  const page = ordered.slice(start, start + input.limit);
  const last = page.at(-1);
  const hasMore = start + page.length < ordered.length;
  return {
    items: page,
    nextCursor: hasMore && last ? encodePageCursor({ id: read.id(last), sort: read.sort(last) }) : null,
  };
}

export function withNextCursor<T extends Record<string, unknown>>(
  body: T,
  nextCursor: string | null | undefined,
): T & { nextCursor?: string | null } {
  if (nextCursor === undefined) return body;
  return { ...body, nextCursor };
}

function compareItems<T>(
  left: T,
  right: T,
  read: { direction: PageDirection; id: (item: T) => string; sort: (item: T) => string },
  factor: number,
): number {
  const sortDelta = read.sort(left).localeCompare(read.sort(right));
  if (sortDelta !== 0) return sortDelta * factor;
  return read.id(left).localeCompare(read.id(right)) * factor;
}

function offsetAfter<T>(
  items: T[],
  cursor: PageCursor,
  read: { direction: PageDirection; id: (item: T) => string; sort: (item: T) => string },
): number {
  const offset = items.findIndex((item) => isAfter(read.sort(item), read.id(item), cursor, read.direction));
  return offset < 0 ? items.length : offset;
}

function isAfter(sort: string, id: string, cursor: PageCursor, direction: PageDirection): boolean {
  if (sort === cursor.sort) {
    return direction === 'asc' ? id > cursor.id : id < cursor.id;
  }
  return direction === 'asc' ? sort > cursor.sort : sort < cursor.sort;
}
