import type { jsPDF } from 'jspdf';
import { brandAccents } from '@trainerpro/ui';
import type { PdfDocument, PdfSection } from './pdf-model';
import { drawChart, drawHeatmap } from './pdf-chart';

const LEFT = 16;
const WIDTH = 178;
const TOP = 39;
const BOTTOM = 277;

/** Standard Helvetica uses WinAnsi, including Spanish accents; replace unsupported symbols. */
export function pdfText(value: unknown): string {
  return String(value)
    .replace(/[–—]/g, '-')
    .replace(/→/g, ' > ')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e\xa0-\xff\n]/g, '');
}

async function loadLogo(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error('Could not load coach logo');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) throw new Error('Invalid coach logo');
  return bytes;
}

type Cursor = { y: number };
function room(pdf: jsPDF, cursor: Cursor, height: number): void {
  if (cursor.y + height <= BOTTOM) return;
  pdf.addPage();
  cursor.y = TOP;
}

function paragraph(pdf: jsPDF, cursor: Cursor, text: string, size = 10, bold = false): void {
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  pdf.setTextColor('#172033');
  const lines = pdf.splitTextToSize(pdfText(text), WIDTH) as string[];
  for (const line of lines) {
    room(pdf, cursor, 6);
    pdf.text(line, LEFT, cursor.y + 4);
    cursor.y += 5.5;
  }
  cursor.y += 2;
}

function sectionStartHeight(pdf: jsPDF, section: PdfSection): number {
  let height = section.chart ? 66 : section.heatmap ? 42 : 18;
  if (section.heading) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    height += (pdf.splitTextToSize(pdfText(section.heading), WIDTH) as string[]).length * 5.5 + 2;
  }
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  for (const line of section.paragraphs ?? []) {
    height += (pdf.splitTextToSize(pdfText(line), WIDTH) as string[]).length * 5.5 + 2;
  }
  return Math.min(height, BOTTOM - TOP);
}

function tableChunks(table: NonNullable<PdfSection['table']>): NonNullable<PdfSection['table']>[] {
  if (table.columns.length <= 6) return [table];
  const count = Math.min(Math.max(1, table.identifyingColumns ?? 1), 3);
  const fixed = Array.from({ length: count }, (_, i) => i);
  const chunks = [];
  for (let start = count; start < table.columns.length; start += 6 - count) {
    const rest = Array.from({ length: Math.min(6 - count, table.columns.length - start) }, (_, i) => start + i);
    const indexes = [...fixed, ...rest];
    chunks.push({
      columns: indexes.map((i) => table.columns[i]!),
      rows: table.rows.map((row) => indexes.map((i) => row[i] ?? '')),
    });
  }
  return chunks;
}

function decorate(pdf: jsPDF, input: PdfDocument, logo: Uint8Array | null, accent: string): void {
  const date = (input.generatedAt ?? new Date()).toLocaleDateString();
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor('#172033');
    const title = pdf.splitTextToSize(pdfText(input.title), logo ? WIDTH - 25 : WIDTH) as string[];
    pdf.text(title.slice(0, 2), LEFT, 15);
    if (logo) {
      const image = pdf.getImageProperties(logo);
      const scale = Math.min(20 / image.width, 20 / image.height);
      pdf.addImage(logo, image.fileType, 194 - image.width * scale, 8, image.width * scale, image.height * scale);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    if (input.clientName) pdf.text(pdfText(input.clientName), LEFT, 29);
    if (input.draft) pdf.text(pdfText(input.labels.draft), 194, 29, { align: 'right' });
    pdf.setDrawColor(accent);
    pdf.setLineWidth(0.7);
    pdf.line(LEFT, 33, 194, 33);
    pdf.setFontSize(8);
    pdf.setTextColor('#526175');
    pdf.text(pdfText(`${input.labels.generated}: ${date}`), LEFT, 288);
    pdf.text(pdfText(`${input.labels.page} ${page} / ${pages}`), 194, 288, { align: 'right' });
  }
}

export async function buildPdf(input: PdfDocument): Promise<jsPDF> {
  const [{ jsPDF: Pdf }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLogo(input.branding?.brandLogoUrl),
  ]);
  const pdf = new Pdf({ unit: 'mm', format: 'a4', compress: false });
  const accent = brandAccents[input.branding?.brandAccent ?? 'blue'].light.primary;
  const cursor = { y: TOP };
  pdf.setProperties({ title: pdfText(input.title), creator: 'TrainerPro' });
  if ((pdf.splitTextToSize(pdfText(input.title), WIDTH - (logo ? 25 : 0)) as string[]).length > 2) {
    paragraph(pdf, cursor, input.title, 12, true);
  }
  for (const section of input.sections) {
    room(pdf, cursor, sectionStartHeight(pdf, section));
    if (section.heading) paragraph(pdf, cursor, section.heading, 12, true);
    for (const line of section.paragraphs ?? []) paragraph(pdf, cursor, line);
    if (section.chart) {
      room(pdf, cursor, 66);
      drawChart(pdf, section.chart, LEFT, cursor.y, WIDTH, 60, accent);
      cursor.y += 66;
    }
    if (section.heatmap) {
      room(pdf, cursor, 42);
      drawHeatmap(pdf, section.heatmap, LEFT, cursor.y, accent);
      cursor.y += 42;
    }
    for (const table of section.table ? tableChunks(section.table) : []) {
      room(pdf, cursor, 18);
      autoTable(pdf, {
        startY: cursor.y,
        margin: { top: TOP, bottom: 20, left: LEFT, right: LEFT },
        head: [table.columns.map(pdfText)],
        body: table.rows.map((row) => row.map(pdfText)),
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.3, overflow: 'linebreak', textColor: '#172033' },
        headStyles: { fillColor: accent, textColor: '#ffffff' },
        alternateRowStyles: { fillColor: '#f3f5f8' },
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
      });
      cursor.y = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }
    cursor.y += 3;
  }
  decorate(pdf, input, logo, accent);
  return pdf;
}

export async function downloadPdf(input: PdfDocument): Promise<void> {
  const pdf = await buildPdf(input);
  pdf.save(input.filename.replace(/[<>:"/\\|?*]/g, '-'));
}
