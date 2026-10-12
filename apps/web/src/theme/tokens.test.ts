import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '../../../../packages/ui/src/theme/ThemeProvider';
import {
  colors,
  fontFamily,
  fontSize,
  lightTheme,
  radius,
  shadow,
  space,
  themes,
} from '../../../../packages/ui/src/theme/tokens';

const UI_SRC = resolve(__dirname, '../../../../packages/ui/src');
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN = /\brgba?\(/;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('color tokens', () => {
  it('uses the agreed primary blue and its hover', () => {
    expect(colors.primary).toBe('#2563eb');
    expect(colors.primaryHover).toBe('#1d4ed8');
  });

  it('keeps text readable (WCAG AA, 4.5:1) on every surface', () => {
    for (const background of [colors.surface, colors.surfaceMuted]) {
      expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textMuted, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps white text readable on the primary action and its hover', () => {
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onPrimary, colors.primaryHover)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps success, warning, danger and info readable as text on their soft backgrounds', () => {
    const pairs = [
      [colors.success, colors.successSoft],
      [colors.warning, colors.warningSoft],
      [colors.danger, colors.dangerSoft],
      [colors.info, colors.infoSoft],
    ] as const;
    for (const [foreground, background] of pairs) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives every semantic color a different value', () => {
    const semantic = [colors.primary, colors.success, colors.warning, colors.danger, colors.info];
    expect(new Set(semantic).size).toBe(semantic.length);
  });

  it('has a single overlay color', () => {
    expect(colors.overlay).toMatch(/^rgba\(/);
  });
});

describe('scales', () => {
  it('follows the agreed spacing, radius and font size scales', () => {
    expect(Object.values(space)).toEqual([4, 8, 12, 16, 24, 32, 48]);
    expect(Object.values(radius)).toEqual([6, 10, 14, 999]);
    expect(Object.values(fontSize)).toEqual([12, 14, 16, 18, 22, 28, 36]);
  });

  it('has small, medium and large shadows that grow', () => {
    expect(shadow.sm.shadowRadius).toBeLessThan(shadow.md.shadowRadius);
    expect(shadow.md.shadowRadius).toBeLessThan(shadow.lg.shadowRadius);
  });

  it('puts Inter first in the sans font stack', () => {
    expect(fontFamily.sans.startsWith('Inter,')).toBe(true);
  });
});

describe('themes', () => {
  it('registers the light theme', () => {
    expect(themes.light).toBe(lightTheme);
    expect(lightTheme.name).toBe('light');
  });
});

describe('ThemeProvider and useTheme', () => {
  function ReadName(): React.ReactElement {
    return React.createElement('span', null, useTheme().name);
  }

  it('gives the light theme inside the provider', () => {
    const html = renderToStaticMarkup(React.createElement(ThemeProvider, null, React.createElement(ReadName)));
    expect(html).toBe('<span>light</span>');
  });

  it('falls back to the light theme without a provider', () => {
    expect(renderToStaticMarkup(React.createElement(ReadName))).toBe('<span>light</span>');
  });
});

describe('packages/ui', () => {
  it('defines colors only in theme/tokens.ts', () => {
    const offenders = listSourceFiles(UI_SRC)
      .filter((file) => !file.replace(/\\/g, '/').endsWith('theme/tokens.ts'))
      .filter((file) => {
        const source = readFileSync(file, 'utf8');
        return HEX.test(source) || COLOR_FN.test(source);
      });
    expect(offenders).toEqual([]);
  });
});
