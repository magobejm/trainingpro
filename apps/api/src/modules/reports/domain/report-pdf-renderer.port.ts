export const REPORT_PDF_RENDERER = Symbol('REPORT_PDF_RENDERER');

export interface ReportPdfRenderer {
  render(lines: string[]): Buffer;
}
