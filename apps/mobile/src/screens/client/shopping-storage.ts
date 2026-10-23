const STORAGE_KEY = 'trainerpro.mobile.shopping';

export function readBought(weekKey: string): string[] {
  const all = readAll();
  return all[weekKey] ?? [];
}

export function writeBought(weekKey: string, foodIds: string[]): void {
  const all = readAll();
  all[weekKey] = foodIds;
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(all));
}

function readAll(): Record<string, string[]> {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
}
