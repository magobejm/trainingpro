export async function allSessionPages<T extends { sessionDate: string; sessionId: string }>(
  fetchPage: (cursor: { beforeDate?: string; beforeId?: string }) => Promise<T[]>,
  limit = 200,
): Promise<T[]> {
  const rows: T[] = [];
  let cursor: { beforeDate?: string; beforeId?: string } = {};
  for (;;) {
    const page = await fetchPage(cursor);
    rows.push(...page);
    if (page.length < limit) return rows;
    const last = page.at(-1)!;
    if (cursor.beforeDate === last.sessionDate.slice(0, 10) && cursor.beforeId === last.sessionId)
      throw new Error('Session pagination did not advance');
    cursor = { beforeDate: last.sessionDate.slice(0, 10), beforeId: last.sessionId };
  }
}
