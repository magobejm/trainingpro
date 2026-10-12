import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ error: true }));
const failingQuery = () => ({
  data: [],
  error: state.error ? new Error('Unavailable') : null,
  isError: state.error,
  isLoading: false,
  refetch: vi.fn(),
});
vi.mock('../../data/hooks/useClientsQuery', () => ({ useClientsQuery: () => ({ data: [] }) }));
vi.mock('../../layout/useListContext', () => ({
  useListContext: (_key: string, initial: unknown) => [initial, vi.fn()],
  useRouteClient: vi.fn(),
  reviveClientId: vi.fn(),
}));
vi.mock('../../data/hooks/useIncidents', () => ({
  useIncidentsQuery: () => failingQuery(),
  useReviewIncidentMutation: () => ({ isPending: false }),
  useRespondIncidentMutation: () => ({ isPending: false }),
  useTagIncidentMutation: () => ({ isPending: false }),
  useAdjustmentDraftMutation: () => ({ isPending: false }),
}));
vi.mock('../../data/hooks/useNotificationPreferences', () => ({
  useNotificationPreferencesQuery: () => failingQuery(),
  useSetNotificationPreferenceMutation: () => ({ isPending: false }),
}));
import i18n from '../../i18n';
import { IncidentsScreen } from './IncidentsScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
describe('screen load failures', () => {
  it('shows a retry action instead of an empty incidents list', () => {
    state.error = true;
    const html = renderToStaticMarkup(React.createElement(IncidentsScreen));
    expect(html).toContain(i18n.t('coach.status.server.title'));
    expect(html).toContain(i18n.t('coach.status.retry'));
    expect(html).not.toContain(i18n.t('coach.incidents.empty'));
  });
  it('does not present editable notification defaults after a load failure', () => {
    state.error = true;
    const html = renderToStaticMarkup(React.createElement(NotificationSettingsScreen));
    expect(html).toContain(i18n.t('coach.status.retry'));
    expect(html).not.toContain(i18n.t('coach.notifications.topic.session_completed'));
  });
  it('shows notification controls after a successful load', () => {
    state.error = false;
    const html = renderToStaticMarkup(React.createElement(NotificationSettingsScreen));
    expect(html).toContain(i18n.t('coach.notifications.topic.session_completed'));
    expect(html).not.toContain(i18n.t('coach.status.retry'));
  });
});
