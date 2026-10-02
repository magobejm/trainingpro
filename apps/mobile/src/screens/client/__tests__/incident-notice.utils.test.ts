import { formatIncidentChatNotice, resolveIncidentCategory } from '../incident-notice.utils';

describe('resolveIncidentCategory', () => {
  it('prefers the stored tag when it is a known category', () => {
    expect(resolveIncidentCategory('lesion', 'LOW')).toBe('lesion');
    expect(resolveIncidentCategory('Molestia', 'HIGH')).toBe('molestia');
    expect(resolveIncidentCategory('dolor', 'CRITICAL')).toBe('dolor');
    expect(resolveIncidentCategory('otro', 'MEDIUM')).toBe('otro');
  });

  it('falls back to severity when the tag is missing', () => {
    expect(resolveIncidentCategory(null, 'LOW')).toBe('molestia');
    expect(resolveIncidentCategory(undefined, 'MEDIUM')).toBe('dolor');
    expect(resolveIncidentCategory('unknown', 'HIGH')).toBe('lesion');
    expect(resolveIncidentCategory('  ', 'CRITICAL')).toBe('lesion');
  });
});

describe('formatIncidentChatNotice', () => {
  it('includes date, severity and content for the trainer chat', () => {
    expect(
      formatIncidentChatNotice({
        category: 'Molestia',
        date: '01/12/2023',
        description: 'Falta de energía generalizada',
      }),
    ).toBe(
      ['⚠️ Incidencia', '📅 Fecha: 01/12/2023', '⚡ Gravedad: Molestia', '📝 Falta de energía generalizada'].join('\n'),
    );
  });
});
