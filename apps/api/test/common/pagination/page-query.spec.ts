import { BadRequestException } from '@nestjs/common';
import {
  completeQueryPage,
  decodePageCursor,
  encodePageCursor,
  queryPageWindow,
  slicePage,
} from '../../../src/common/pagination/page-query';

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

  it('uses binary code-point order for keys and ids, matching PostgreSQL C collation', () => {
    const items = [
      { id: 'b', name: 'same' },
      { id: 'a', name: 'same' },
      { id: 'unicode-later', name: '\u{10000}' },
      { id: 'unicode-earlier', name: '\uE000' },
    ];
    expect(slicePage(items, { limit: 4 }, read).items.map((item) => item.id)).toEqual([
      'a',
      'b',
      'unicode-earlier',
      'unicode-later',
    ]);
  });

  it('rechaza un cursor ilegible', () => {
    expect(() => decodePageCursor('%%%')).toThrow(BadRequestException);
  });
});

describe('database page helpers', () => {
  const read = {
    direction: 'desc' as const,
    id: (row: Row) => row.id,
    sort: (row: Row) => row.name,
  };

  it('requests one lookahead row and decodes a cursor without requiring its row to exist', () => {
    const cursor = encodePageCursor({ id: 'removed-row', sort: 'Ana' });
    expect(queryPageWindow({ cursor, limit: 2 })).toEqual({
      after: { id: 'removed-row', sort: 'Ana' },
      take: 3,
    });
  });

  it('builds the next cursor from the last visible row, not the lookahead row', () => {
    const page = completeQueryPage(
      [
        { id: 'c', name: 'Luis' },
        { id: 'b', name: 'Ana' },
        { id: 'a', name: 'Alicia' },
      ],
      { limit: 2 },
      read,
    );
    expect(page).toEqual({
      items: [
        { id: 'c', name: 'Luis' },
        { id: 'b', name: 'Ana' },
      ],
      nextCursor: encodePageCursor({ id: 'b', sort: 'Ana' }),
    });
  });

  it('omits nextCursor without lookahead and preserves the unbounded response', () => {
    expect(completeQueryPage([{ id: 'a', name: 'Ana' }], { limit: 2 }, read)).toEqual({
      items: [{ id: 'a', name: 'Ana' }],
      nextCursor: null,
    });
    expect(completeQueryPage([{ id: 'a', name: 'Ana' }], {}, read)).toEqual({
      items: [{ id: 'a', name: 'Ana' }],
    });
  });
});
