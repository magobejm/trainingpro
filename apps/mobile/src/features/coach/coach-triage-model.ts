export type TriageCategoryId =
  | 'adherence'
  | 'calls'
  | 'chat'
  | 'incidents'
  | 'mood'
  | 'nutrition'
  | 'reports'
  | 'routines'
  | 'wearables';

export type Triage = {
  adherence: Array<{ clientId: string; daysWithoutWorkout: number | null; name: string; weekAdherence: number | null }>;
  calls: Array<{ clientId: string; id: string; name: string; status: string; time: string }>;
  chat: Array<{ clientId: string; name: string; since: string }>;
  collapsed: string[];
  incidents: Array<{ clientId: string; id: string; name: string; severity: string }>;
  mood: Array<{
    clientId: string;
    fields: string[];
    motivation: number | null;
    name: string;
    pain: number | null;
    recovery: number | null;
    sleep: number | null;
  }>;
  nutrition: Array<{ clientId: string; name: string }>;
  reports: Array<{ clientId: string; id: string; name: string; weekStart: string }>;
  routines: Array<{ clientId: string; daysLeft?: number; kind: 'ending' | 'noCalendar' | 'noRoutine'; name: string }>;
  wearableSignals: Array<{ clientId: string; hrvMs: number | null; name: string; sleepMinutes: number | null }>;
};

export type TriageTabId = 'chat' | 'motivation' | 'plan';

export const TRIAGE_TABS: ReadonlyArray<{ categories: TriageCategoryId[]; id: TriageTabId }> = [
  { categories: ['chat', 'incidents', 'calls'], id: 'chat' },
  { categories: ['mood', 'adherence', 'reports', 'wearables'], id: 'motivation' },
  { categories: ['routines', 'nutrition'], id: 'plan' },
];

export function categoryCount(data: Triage | undefined, id: TriageCategoryId): number {
  if (!data) return 0;
  return (id === 'wearables' ? data.wearableSignals : data[id])?.length ?? 0;
}

export function openCount(data: Triage | undefined, categories: TriageCategoryId[], collapsed: string[]): number {
  return categories.reduce((sum, id) => sum + (collapsed.includes(id) ? 0 : categoryCount(data, id)), 0);
}

export function totalOpenCount(data: Triage | undefined, collapsed: string[]): number {
  return TRIAGE_TABS.reduce((sum, tab) => sum + openCount(data, tab.categories, collapsed), 0);
}

export function countClientsWithOpenIncidents(incidents: Array<{ clientId: string; status: string }>): number {
  return new Set(incidents.filter((item) => item.status === 'OPEN').map((item) => item.clientId)).size;
}
