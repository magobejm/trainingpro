type MessageIdentity = { id: string };
export function appendedMessageCount(previous: MessageIdentity[], current: MessageIdentity[]): number {
  const last = previous[previous.length - 1];
  if (!last) return 0;
  const lastIndex = current.findIndex((message) => message.id === last.id);
  if (lastIndex < 0) return 0;
  const known = new Set(previous.map((message) => message.id));
  return current.slice(lastIndex + 1).filter((message) => !known.has(message.id)).length;
}
export function shouldLoadHistory(offset: number, hasOlder: boolean, loading: boolean, error: unknown): boolean {
  return offset <= 120 && hasOlder && !loading && !error;
}
export function messageDay(value: string): string {
  const date = new Date(value);
  return [date.getFullYear(), date.getMonth(), date.getDate()].join('-');
}
export function messageDateLabel(value: string, locale: string, today: string, now = new Date()): string {
  if (messageDay(value) === messageDay(now.toISOString())) return today;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export function restoredAnchorOffset(offset: number, previousY: number, currentY: number): number {
  return Math.max(0, offset + currentY - previousY);
}

export function anchorHasSettled(stableFrames: number, elapsedMs: number): boolean {
  return elapsedMs >= 1500 || (elapsedMs >= 250 && stableFrames >= 8);
}
