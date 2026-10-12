import { colors } from '@trainerpro/ui';
export type CalendarEventType = 'call' | 'note' | 'physical_test' | 'reminder' | 'workout';

export type CallStatus = 'accepted' | 'pending' | 'unconfirmed';

export type CalendarEventData = {
  id: string;
  coachMembershipId: string;
  clientId: string | null;
  clientName?: string;
  type: CalendarEventType;
  callStatus?: CallStatus;
  date: Date;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  isCompleted?: boolean;
  originDate?: string | null;
  planDayId: string | null;
  planDayTitle?: string;
  scheduleId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CalendarColor = {
  bg: string;
  text: string;
  border: string;
};

export const CALENDAR_COLORS: CalendarColor[] = [
  { bg: colors.primarySoft, text: colors.primary, border: colors.primaryBorder },
  { bg: colors.successSoft, text: colors.success, border: colors.success },
  { bg: colors.chartPurpleSoft, text: colors.chartPurple, border: colors.chartPurple },
  { bg: colors.warningSoft, text: colors.warning, border: colors.warning },
  { bg: colors.dangerSoft, text: colors.danger, border: colors.danger },
  { bg: colors.chartTealSoft, text: colors.chartTeal, border: colors.chartTeal },
  { bg: colors.infoSoft, text: colors.info, border: colors.info },
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
