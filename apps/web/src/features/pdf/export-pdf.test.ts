import { describe, expect, it } from 'vitest';
import { buildPdf } from './export-pdf';

const base = {
  title: 'Routine export',
  filename: 'routine.pdf',
  labels: { generated: 'Generated', draft: 'Draft', page: 'Page' },
};

describe('PDF documents', () => {
  it('paginates long tables, repeats column headers and includes the final row', async () => {
    const pdf = await buildPdf({
      ...base,
      draft: true,
      sections: [
        {
          table: {
            columns: ['Exercise', 'Sets', 'Weight'],
            rows: Array.from({ length: 130 }, (_, i) => [`Exercise ${i}`, 3, 50 + i]),
          },
        },
      ],
    });
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    const bytes = pdf.output();
    expect(bytes).toContain('Exercise 129');
    expect(bytes.match(/\(Exercise\)/g)?.length).toBe(pdf.getNumberOfPages());
    expect(bytes.match(/\(Draft\)/g)?.length).toBe(pdf.getNumberOfPages());
    expect(bytes).toContain('/MediaBox [0 0 595.2799999999999727 841.8899999999999864]');
  });

  it('retains identifying columns when splitting wide tables', async () => {
    const pdf = await buildPdf({
      ...base,
      sections: [
        {
          table: {
            columns: ['Set', ...Array.from({ length: 12 }, (_, i) => `Variable${i}`)],
            rows: [['Set 1', ...Array.from({ length: 12 }, (_, i) => `Value${i}`)]],
          },
        },
      ],
    });
    expect(pdf.output()).toContain('Variable11');
    expect(pdf.output().match(/\(Set 1\)/g)?.length).toBe(3);
  });

  it('fails before creating a partial branded document when the logo cannot load', async () => {
    await expect(
      buildPdf({ ...base, branding: { brandAccent: 'violet', brandLogoUrl: 'invalid://logo' }, sections: [] }),
    ).rejects.toThrow();
  });

  it('embeds a private PNG logo and prints accents, chart data and multiple pages', async () => {
    const logo =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOosXoLAALZAaQGKdQKAAAAAElFTkSuQmCC';
    const pdf = await buildPdf({
      ...base,
      title: 'Nutrición, sesión y evolución',
      clientName: 'José Muñoz',
      branding: { brandAccent: 'violet', brandLogoUrl: logo },
      sections: [
        {
          heading: 'Evolución (kg)',
          chart: {
            unit: 'kg',
            points: [
              { label: '2026-10-01', value: 50 },
              { label: '2026-10-02', value: null },
              { label: '2026-10-03', value: 65 },
              { label: '2026-10-04', value: 75 },
            ],
          },
        },
        {
          heading: 'Indicaciones',
          paragraphs: Array.from(
            { length: 65 },
            () => 'Nutrición y planificación: añade plátano, piña y proteínas. Atención a la técnica y al descanso.',
          ),
        },
      ],
    });
    expect(pdf.output()).toContain('/Subtype /Image');
    expect(pdf.output()).toContain('Muñoz');
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    if (process.env.PDF_QA_OUTPUT) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(process.env.PDF_QA_OUTPUT, new Uint8Array(pdf.output('arraybuffer')));
    }
  });
});

describe('PDF chart pagination', () => {
  it('keeps a chart heading with its plot across page breaks', async () => {
    const pdf = await buildPdf({
      ...base,
      sections: [
        { paragraphs: Array.from({ length: 26 }, () => 'Previous content') },
        { heading: 'Chart heading', chart: { unit: 'kg', points: [{ label: 'Unique date', value: 42 }] } },
      ],
    });
    const pages = (pdf.internal as unknown as { pages: string[][] }).pages;
    const headingPage = pages.findIndex((commands) => commands?.join('\n').includes('(Chart heading)'));
    const chartPage = pages.findIndex((commands) => commands?.join('\n').includes('(Unique date)'));
    expect(headingPage).toBeGreaterThan(0);
    expect(headingPage).toBe(chartPage);
  });
});
