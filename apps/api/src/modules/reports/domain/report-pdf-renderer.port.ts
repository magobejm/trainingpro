export const REPORT_PDF_RENDERER = Symbol('REPORT_PDF_RENDERER');

export type ReportPdfBranding = {
  accent: string | null;
  logo?: { data: Buffer; width: number; height: number };
};

export interface ReportPdfRenderer {
  render(lines: string[], branding?: ReportPdfBranding): Buffer;
}
