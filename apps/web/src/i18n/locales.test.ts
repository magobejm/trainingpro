import { describe, expect, it } from 'vitest';
import en from './locales/en/common.json';
import es from './locales/es/common.json';

const esKeys = Object.keys(es);
const enKeys = Object.keys(en);

function placeholders(text: string): string[] {
  return (text.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();
}

describe('locales', () => {
  it('has every Spanish key in English', () => {
    expect(esKeys.filter((key) => !(key in en))).toEqual([]);
  });

  it('has every English key in Spanish', () => {
    expect(enKeys.filter((key) => !(key in es))).toEqual([]);
  });

  it('keeps the same interpolation placeholders in both languages', () => {
    const mismatched = esKeys.filter(
      (key) =>
        key in en &&
        placeholders((es as Record<string, string>)[key] ?? '').join() !==
          placeholders((en as Record<string, string>)[key] ?? '').join(),
    );
    expect(mismatched).toEqual([]);
  });

  it('has no empty translations', () => {
    const empty = esKeys.filter((key) => !(es as Record<string, string>)[key]?.trim());
    expect(empty).toEqual([]);
  });
});
