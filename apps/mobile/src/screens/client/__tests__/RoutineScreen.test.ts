import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClientRoutine, ClientRoutineDay } from '@trainerpro/shared';
import type { ClientCalendarEvent } from '../../../data/hooks/useClientCalendar';
import { useClientCalendarEventsQuery, useClientCalendarSessionsQuery } from '../../../data/hooks/useClientCalendar';
import { useClientRoutineQuery, useScheduledPlanDays } from '../../../data/hooks/useClientRoutineQuery';
import { RoutineScreen } from '../RoutineScreen';

const mockPressables: Array<{ children: React.ReactNode; onPress: () => void }> = [];

jest.mock('react-native', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  const element = ({ children }: { children?: React.ReactNode }) => react.createElement('div', null, children);
  return {
    ActivityIndicator: element,
    Pressable: (props: { children: React.ReactNode; onPress: () => void }) => {
      mockPressables.push(props);
      return react.createElement('button', null, props.children);
    },
    ScrollView: element,
    StyleSheet: { create: (styles: unknown) => styles },
    Text: element,
    View: element,
  };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../../data/hooks/useClientCalendar', () => ({
  useClientCalendarEventsQuery: jest.fn(),
  useClientCalendarSessionsQuery: jest.fn(),
}));
jest.mock('../../../data/hooks/useClientRoutineQuery', () => ({
  useClientRoutineQuery: jest.fn(),
  useScheduledPlanDays: jest.fn(),
}));
jest.mock('../../../data/hooks/usePhysicalTests', () => ({ usePhysicalTestSchedulesQuery: () => ({ data: [] }) }));
jest.mock('../../../shell/client/client-shell.primitives', () => ({ OverlayBackHeader: () => null }));
jest.mock('../../../shell/client/client-shell.styles', () => ({ s: {} }));
jest.mock('../ClientNeatSection', () => ({ ClientNeatSection: () => null }));
jest.mock('../WorkoutWarmups', () => ({ WarmupBadge: () => null, warmupStyles: {} }));

const days: ClientRoutineDay[] = [
  { id: 'current-leg', title: 'Pierna actual', dayIndex: 1, exercises: [], notes: null },
  { id: 'current-push', title: 'Empuje actual', dayIndex: 2, exercises: [], notes: null },
];
const routine: ClientRoutine = {
  id: 'current-routine',
  name: 'Rutina asignada',
  expectedCompletionDays: 7,
  objectives: [],
  planDays: days,
};
const legacyDay: ClientRoutineDay = {
  id: 'previous-day',
  title: 'Entrenamiento anterior',
  dayIndex: 1,
  exercises: [],
  notes: null,
};
const event: ClientCalendarEvent = {
  id: 'moved-workout',
  date: '2026-10-19',
  type: 'workout',
  planDayId: legacyDay.id,
  planDayTitle: legacyDay.title,
  title: legacyDay.title,
  color: null,
  content: null,
  time: null,
};

function renderRoutine() {
  const onSelectDay = jest.fn();
  const html = renderToStaticMarkup(
    React.createElement(RoutineScreen, {
      onClose: jest.fn(),
      onOpenTest: jest.fn(),
      onSelectDay,
    }),
  );
  return { html, onSelectDay };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 19, 12));
  mockPressables.length = 0;
  (useClientRoutineQuery as jest.Mock).mockReturnValue({ data: routine, isLoading: false });
  (useScheduledPlanDays as jest.Mock).mockReturnValue([legacyDay]);
  (useClientCalendarEventsQuery as jest.Mock).mockReturnValue({ data: { data: [event] }, isLoading: false });
  (useClientCalendarSessionsQuery as jest.Mock).mockReturnValue({ data: [] });
});
afterEach(() => jest.useRealTimers());

it.each(['IN_PROGRESS', 'COMPLETED'])('keeps all assigned days beside a moved %s workout', (status) => {
  (useClientCalendarSessionsQuery as jest.Mock).mockReturnValue({ data: [{ planDayId: legacyDay.id, status }] });
  const { html, onSelectDay } = renderRoutine();
  expect(html).toContain('Entrenamiento anterior');
  expect(html).toContain('Pierna actual');
  expect(html).toContain('Empuje actual');
  expect(html).toContain('mobile.client.routine.assignedDays');
  const assignedCard = mockPressables.find((card) =>
    renderToStaticMarkup(React.createElement(React.Fragment, null, card.children)).includes('Empuje actual'),
  );
  expect(assignedCard).toBeDefined();
  assignedCard!.onPress();
  expect(onSelectDay).toHaveBeenCalledWith(days[1]);
});

it('keeps unscheduled assigned days accessible after completing another assigned day today', () => {
  (useClientCalendarEventsQuery as jest.Mock).mockReturnValue({
    data: { data: [{ ...event, planDayId: days[0]!.id, planDayTitle: days[0]!.title }] },
    isLoading: false,
  });
  (useClientCalendarSessionsQuery as jest.Mock).mockReturnValue({
    data: [{ planDayId: days[0]!.id, status: 'COMPLETED' }],
  });
  const { html } = renderRoutine();
  expect(html).toContain('Empuje actual');
});

it('shows the assigned routine once when no workouts are scheduled', () => {
  (useClientCalendarEventsQuery as jest.Mock).mockReturnValue({ data: { data: [] }, isLoading: false });
  const { html } = renderRoutine();
  expect(html.match(/Pierna actual/g)).toHaveLength(1);
  expect(html.match(/Empuje actual/g)).toHaveLength(1);
});
