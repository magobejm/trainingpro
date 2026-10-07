import { buildSimplePdf } from '../../src/modules/reports/infra/pdf/simple-pdf.builder';
import { buildWeeklyReportLines } from '../../src/modules/reports/application/weekly-report-lines';

describe('simple pdf builder', () => {
  it('keeps accents, line breaks and parentheses on one page', () => {
    const pdf = buildSimplePdf(['Sesión de fuerza (ñ)', '¿Listo?\nSegunda línea']);
    const text = pdf.toString('latin1');
    const lines = extractTextLines(pdf);

    expect(text).toContain('/Encoding /WinAnsiEncoding');
    expect(text).toContain('16 TL');
    expect(readPageCount(text)).toBe(1);
    expect(lines).toEqual(['Sesión de fuerza (ñ)', '¿Listo?', 'Segunda línea']);
    expect(pointsAtXref(pdf)).toBe(true);
  });

  it('splits a long report across pages without dropping lines', () => {
    const source = Array.from({ length: 100 }, (_, index) => `Fila ${String(index).padStart(3, '0')} sesión`);
    const pdf = buildSimplePdf(source);
    const text = pdf.toString('latin1');
    const lines = extractTextLines(pdf);

    expect(readPageCount(text)).toBeGreaterThan(1);
    expect(countPages(text)).toBe(readPageCount(text));
    expect(lines).toEqual(source);
    expect(pointsAtXref(pdf)).toBe(true);
  });

  it('wraps a line wider than the page and keeps every word', () => {
    const source = Array.from({ length: 40 }, (_, index) => `palabra${index}`).join(' ');
    const lines = extractTextLines(buildSimplePdf([source]));

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(source);
    expect(lines.every((line) => line.length > 0)).toBe(true);
  });
});

describe('weekly report lines', () => {
  it('includes every row of the range', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-03-01T00:00:00.000Z');
    const weeklyReports = Array.from({ length: 9 }, (_, index) => ({
      adherencePercent: index,
      energy: 5,
      mood: 6,
      reportDate: new Date(Date.UTC(2026, 0, index + 1)),
      sleepHours: 7,
    }));
    const lines = buildWeeklyReportLines(
      { cardioRows: [], srpeRows: [], strengthRows: [], weeklyReports },
      { clientId: 'cliente-1', from, to },
    );

    expect(lines.filter((line) => line.includes('mood:6'))).toHaveLength(9);
  });
});

function extractTextLines(pdf: Buffer): string[] {
  const text = pdf.toString('latin1');
  const lines: string[] = [];
  for (const match of text.matchAll(/\(((?:\\.|[^\\)])*)\) Tj/gu)) {
    lines.push(unescapePdfText(match[1] ?? ''));
  }
  return lines;
}

function unescapePdfText(value: string): string {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && index + 1 < value.length) {
      decoded += value[index + 1];
      index += 1;
      continue;
    }
    decoded += value[index];
  }
  return decoded;
}

function readPageCount(text: string): number {
  const match = text.match(/\/Count (\d+)/u);
  return Number(match?.[1] ?? 0);
}

function countPages(text: string): number {
  return [...text.matchAll(/\/Type \/Page /gu)].length;
}

function pointsAtXref(pdf: Buffer): boolean {
  const text = pdf.toString('latin1');
  const match = text.match(/startxref\n(\d+)\n/u);
  const offset = Number(match?.[1] ?? -1);
  return pdf.subarray(offset - 1, offset + 5).toString('ascii') === '\nxref\n';
}
