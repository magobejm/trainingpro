export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function matchesSearch(haystack: string, needle: string | undefined): boolean {
  const n = normalizeSearch(needle ?? '');
  if (!n) return true;
  return normalizeSearch(haystack).includes(n);
}
