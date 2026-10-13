import { describe, expect, it } from 'vitest';
import { decodeUserKey, parseAppearance, resolveAppearanceTheme, saveAppearance, readAppearance } from './appearance.logic';
import { brandAccents, darkTheme, lightTheme, paletteForWeb } from '../../../../packages/ui/src/theme/tokens';

describe('appearance preferences', () => {
  it('defaults to system and comfortable for corrupt or unsupported values', () => {
    expect(parseAppearance('{')).toEqual({ mode: 'system', density: 'comfortable' });
    expect(parseAppearance('{"mode":"unknown","density":"dense"}')).toEqual({ mode: 'system', density: 'comfortable' });
  });
  it('follows the system only in system mode', () => {
    expect(resolveAppearanceTheme('system', true)).toBe('dark');
    expect(resolveAppearanceTheme('light', true)).toBe('light');
    expect(resolveAppearanceTheme('dark', false)).toBe('dark');
  });
  it('isolates saved preferences by authenticated identity', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    saveAppearance(storage, 'one', { mode: 'dark', density: 'compact' });
    expect(readAppearance(storage, 'one')).toEqual({ mode: 'dark', density: 'compact' });
    expect(readAppearance(storage, 'two')).toEqual({ mode: 'system', density: 'comfortable' });
    expect(readAppearance(storage, null)).toEqual({ mode: 'system', density: 'comfortable' });
  });
  it('survives unavailable browser storage', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readAppearance(storage, 'one').mode).toBe('system');
    expect(() => saveAppearance(storage, 'one', { mode: 'dark', density: 'compact' })).not.toThrow();
  });
  it('uses the token subject and rejects invalid authentication', () => {
    expect(decodeUserKey('header.' + btoa(JSON.stringify({ sub: 'user-one' })) + '.signature')).toBe('user-one');
    expect(decodeUserKey('bad')).toBeNull();
  });
});

const luminance = (hex: string) => {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
};
const contrast = (a: string, b: string) => {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
};

describe('appearance palettes', () => {
  it('has readable text and actions for all eight brands in both themes', () => {
    expect(Object.keys(brandAccents)).toHaveLength(8);
    for (const theme of [lightTheme, darkTheme]) {
      for (const accent of Object.values(brandAccents)) {
        const colors = { ...theme.colors, ...accent[theme.name] };
        for (const surface of [colors.surface, colors.surfaceMuted, colors.background]) {
          expect(contrast(colors.text, surface)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(colors.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(colors.onPrimary, colors.primaryHover)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('provides CSS variables only to web and keeps native fallback colors', () => {
    expect(paletteForWeb(lightTheme.colors, false).primary).toBe(lightTheme.colors.primary);
    expect(paletteForWeb(lightTheme.colors, true).surface).toContain('var(--tp-surface,');
  });
});
