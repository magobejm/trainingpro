import type { ClientData, NoteData } from './notes-screen.types';

export function formatNoteDate(date: Date, t: (k: string) => string): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) {
    return `${t('common.today')}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `${t('common.yesterday')}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function filterAndSortNotes(
  notes: NoteData[],
  historyFilter: 'all' | 'general' | 'client',
  selectedClient: ClientData | null,
  dateFrom: string,
  dateTo: string,
  showAllHistory: boolean,
): NoteData[] {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const effectiveDateFrom = dateFrom ? new Date(dateFrom) : !showAllHistory ? oneMonthAgo : null;
  let effectiveDateTo = dateTo ? new Date(dateTo) : null;
  if (effectiveDateTo) {
    effectiveDateTo = new Date(effectiveDateTo);
    effectiveDateTo.setHours(23, 59, 59, 999);
  }
  let filtered = notes;
  if (effectiveDateFrom) filtered = filtered.filter((n) => n.createdAt >= effectiveDateFrom);
  if (effectiveDateTo) filtered = filtered.filter((n) => n.createdAt <= effectiveDateTo);
  if (historyFilter === 'general') filtered = filtered.filter((n) => n.type === 'general');
  else if (historyFilter === 'client' && selectedClient) {
    filtered = filtered.filter((n) => n.type === 'client' && n.clientId === selectedClient.id);
  }
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
