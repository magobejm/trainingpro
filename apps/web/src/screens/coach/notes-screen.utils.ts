import { formatDate } from '@trainerpro/shared';
import type { ClientData, NoteData } from './notes-screen.types';

export function formatNoteDate(date: Date, t: (k: string) => string, locale = 'es'): string {
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
  return formatDate(date, locale);
}

export function notesListQuery(
  filters: {
    dateFrom: string;
    dateTo: string;
    historyFilter: 'all' | 'client' | 'general';
    selectedClientId: string;
    showAllHistory: boolean;
  },
  now = new Date(),
): { clientId?: string; dateFrom?: string; dateTo?: string; scope?: 'client' | 'general' } {
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  monthAgo.setHours(0, 0, 0, 0);
  const scope = filters.historyFilter === 'all' ? undefined : filters.historyFilter;
  const clientId = scope === 'client' && filters.selectedClientId ? filters.selectedClientId : undefined;
  return {
    clientId,
    dateFrom: filters.dateFrom
      ? dayBound(filters.dateFrom, false)
      : filters.showAllHistory
        ? undefined
        : monthAgo.toISOString(),
    dateTo: filters.dateTo ? dayBound(filters.dateTo, true) : undefined,
    scope: scope === 'client' && !clientId ? undefined : scope,
  };
}

function dayBound(value: string, end: boolean): string {
  if (value.includes('T')) return new Date(value).toISOString();
  return `${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z`;
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
