export const CALENDAR_REPOSITORY = Symbol('CALENDAR_REPOSITORY');

export type CalendarEventType = 'call' | 'note' | 'reminder' | 'workout';

export type CallStatus = 'accepted' | 'pending' | 'unconfirmed';

export type CalendarEventEntity = {
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
  originDate: Date | null;
  planDayId: string | null;
  isCompleted?: boolean;
  planDayTitle?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCalendarEventInput = {
  type: CalendarEventType;
  date: string;
  title?: string;
  content?: string;
  time?: string;
  color?: string;
  clientId?: string;
  planDayId?: string;
};

export type UpdateCalendarEventInput = {
  title?: string;
  content?: string;
  time?: string;
  color?: string;
  date?: string;
};

export type ListCalendarEventsQuery = {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  coachOnly?: boolean;
};

export interface ICalendarRepository {
  create(coachMembershipId: string, input: CreateCalendarEventInput): Promise<CalendarEventEntity>;
  findById(id: string, coachMembershipId: string): Promise<CalendarEventEntity | null>;
  list(coachMembershipId: string, query: ListCalendarEventsQuery): Promise<CalendarEventEntity[]>;
  update(id: string, coachMembershipId: string, input: UpdateCalendarEventInput): Promise<CalendarEventEntity>;
  delete(id: string, coachMembershipId: string): Promise<void>;
}
