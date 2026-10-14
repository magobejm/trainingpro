import { BadRequestException } from '@nestjs/common';
import { decodePageCursor, encodePageCursor, slicePage } from '../../../src/common/pagination/page-query';

type Row = { id: string; name: string };

const rows: Row[] = [
  { id: 'b', name: 'Ana' },
  { id: 'a', name: 'Ana' },
  { id: 'c', name: 'Luis' },
];

const read = {
  direction: 'asc' as const,
  id: (row: Row) => row.id,
  sort: (row: Row) => row.name,
};

describe('slicePage', () => {
  it('devuelve la lista completa cuando no hay límite', () => {
    expect(slicePage(rows, {}, read)).toEqual({ items: rows });
  });

  it('devuelve la primera página y un cursor', () => {
    const page = slicePage(rows, { limit: 2 }, read);
    expect(page.items.map((row) => row.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toEqual(encodePageCursor({ id: 'b', sort: 'Ana' }));
  });

  it('continúa después del cursor y cierra con null', () => {
    const first = slicePage(rows, { limit: 2 }, read);
    const last = slicePage(rows, { cursor: first.nextCursor ?? '', limit: 2 }, read);
    expect(last.items.map((row) => row.id)).toEqual(['c']);
    expect(last.nextCursor).toBeNull();
  });

  it('rechaza un cursor ilegible', () => {
    expect(() => decodePageCursor('%%%')).toThrow(BadRequestException);
  });
});
