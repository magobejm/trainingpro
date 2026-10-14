import type { CoachBranding } from '../../data/hooks/useBranding';

export type PdfChart = { points: { label: string; value: number | null }[]; unit: string; color?: string };
export type PdfSection = {
  heading?: string;
  paragraphs?: string[];
  table?: { columns: string[]; rows: (string | number)[][]; identifyingColumns?: number };
  chart?: PdfChart;
  heatmap?: { date: string; level: number; tonnage: number }[][];
};
export type PdfDocument = {
  title: string;
  filename: string;
  clientName?: string;
  draft?: boolean;
  generatedAt?: Date;
  locale?: string;
  branding?: CoachBranding;
  sections: PdfSection[];
  labels: { generated: string; draft: string; page: string };
};
