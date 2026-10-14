import { formatDate } from '../format-date';

describe('formatDate', () => {
  const value = new Date('2026-10-12T12:00:00.000Z');

  it('formatea en español', () => {
    const text = formatDate(value, 'es');
    expect(text).toContain('12');
    expect(text.toLowerCase()).toContain('oct');
    expect(text).toContain('2026');
  });

  it('formatea en inglés', () => {
    const text = formatDate(value, 'en');
    expect(text).toContain('12');
    expect(text.toLowerCase()).toContain('oct');
    expect(text).toContain('2026');
  });

  it('devuelve vacío si la fecha no es válida', () => {
    expect(formatDate('no-es-fecha', 'es')).toBe('');
    expect(formatDate(null, 'es')).toBe('');
  });
});
