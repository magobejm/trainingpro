export type CalendarEventType = 'note' | 'reminder' | 'workout';

export type CalendarEventData = {
  id: string;
  coachMembershipId: string;
  clientId: string | null;
  clientName?: string;
  type: CalendarEventType;
  date: Date;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  planDayId: string | null;
  planDayTitle?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CalendarColor = {
  bg: string;
  text: string;
  border: string;
};

export const CALENDAR_COLORS: CalendarColor[] = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' }, // blue
  { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }, // green
  { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }, // purple
  { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // orange
  { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' }, // rose
  { bg: '#fef9c3', text: '#a16207', border: '#fef08a' }, // yellow
  { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' }, // indigo
];

export const DEFAULT_COLOR = CALENDAR_COLORS[0];

export type RoutineDayCard = {
  id: string;
  title: string;
  dayIndex: number;
  exerciseCount: number;
  color: string;
};

export type CalendarDragData = {
  planDayId: string;
  planDayTitle: string;
  clientId: string;
  color: string;
};
