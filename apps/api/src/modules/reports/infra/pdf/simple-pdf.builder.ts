export function buildSimplePdf(lines: string[]): Buffer {
  const safeLines = lines.map((line) => sanitizeLine(line));
  const content = buildContentStream(safeLines);
  const contentBytes = Buffer.from(content, 'utf8');
  const objects = buildPdfObjects(contentBytes);
  const header = Buffer.from('%PDF-1.4\n');
  const chunks: Buffer[] = [header];
  const offsets = [0];
  let cursor = header.length;
  for (const object of objects) {
    if (isObjectStart(object)) {
      offsets.push(cursor);
    }
    chunks.push(object);
    cursor += object.length;
  }
  const xref = buildXref(offsets);
  chunks.push(Buffer.from(xref, 'utf8'));
  return Buffer.concat(chunks);
}

function buildPdfObjects(contentBytes: Buffer): Buffer[] {
  return [
    Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    Buffer.from(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
        '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    ),
    Buffer.from('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'),
    Buffer.from(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
    contentBytes,
    Buffer.from('\nendstream\nendobj\n'),
  ];
}

function buildContentStream(lines: string[]): string {
  const content = ['BT', '/F1 12 Tf', '50 760 Td'];
  for (const line of lines) {
    content.push(`(${line}) Tj`);
    content.push('T*');
  }
  content.push('ET');
  return `${content.join('\n')}\n`;
}

function buildXref(offsets: number[]): string {
  const entries = ['0000000000 65535 f '];
  for (const offset of offsets.slice(1)) {
    entries.push(`${offset.toString().padStart(10, '0')} 00000 n `);
  }
  const totalObjects = offsets.length;
  return [
    'xref',
    `0 ${totalObjects}`,
    ...entries,
    'trailer',
    `<< /Size ${totalObjects} /Root 1 0 R >>`,
    'startxref',
    `${offsets[offsets.length - 1]}`,
    '%%EOF',
    '',
  ].join('\n');
}

function isObjectStart(buffer: Buffer): boolean {
  const text = buffer.toString('utf8', 0, Math.min(16, buffer.length));
  return /^\d+ 0 obj/.test(text);
}

function sanitizeLine(input: string): string {
  return input.replace(/[()\\]/g, '').slice(0, 120);
}
