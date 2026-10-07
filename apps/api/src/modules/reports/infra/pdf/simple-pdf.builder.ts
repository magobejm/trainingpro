const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const FONT_SIZE = 12;
const LEADING = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FIRST_BASELINE = PAGE_HEIGHT - MARGIN - FONT_SIZE;

const HELVETICA_WIDTHS: Record<string, number> = {
  ' ': 278,
  '!': 278,
  '"': 355,
  '#': 556,
  $: 556,
  '%': 889,
  '&': 667,
  "'": 191,
  '(': 333,
  ')': 333,
  '*': 389,
  '+': 584,
  ',': 278,
  '-': 333,
  '.': 278,
  '/': 278,
  '0': 556,
  '1': 556,
  '2': 556,
  '3': 556,
  '4': 556,
  '5': 556,
  '6': 556,
  '7': 556,
  '8': 556,
  '9': 556,
  ':': 278,
  ';': 278,
  '<': 584,
  '=': 584,
  '>': 584,
  '?': 556,
  '@': 1015,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  '[': 278,
  '\\': 278,
  ']': 278,
  '^': 469,
  _: 556,
  '`': 333,
  '{': 334,
  '|': 260,
  '}': 334,
  '~': 584,
  '¡': 333,
  '¿': 556,
};

export function buildSimplePdf(lines: string[]): Buffer {
  const pages = paginate(wrapLines(lines));
  return assemblePdf(buildObjects(pages));
}

function wrapLines(lines: string[]): string[] {
  return lines.flatMap((line) => line.split(/\r?\n/).flatMap((part) => wrapParagraph(part)));
}

function wrapParagraph(text: string): string[] {
  if (text.length === 0) {
    return [''];
  }
  const wrapped: string[] = [];
  let current = '';
  for (const token of text.split(/(\s+)/).filter((part) => part.length > 0)) {
    current = appendToken(wrapped, current, token);
  }
  wrapped.push(current.replace(/\s+$/u, ''));
  return wrapped;
}

function appendToken(wrapped: string[], current: string, token: string): string {
  if (/^\s+$/u.test(token)) {
    return textWidth(current + token) <= CONTENT_WIDTH ? current + token : current;
  }
  if (textWidth(current + token) <= CONTENT_WIDTH) {
    return current + token;
  }
  const next = current.replace(/\s+$/u, '');
  if (next.length > 0) {
    wrapped.push(next);
  }
  if (textWidth(token) <= CONTENT_WIDTH) {
    return token;
  }
  const pieces = splitWord(token);
  wrapped.push(...pieces.slice(0, -1));
  return pieces[pieces.length - 1] ?? '';
}

function splitWord(word: string): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const char of word) {
    if (current.length > 0 && textWidth(current + char) > CONTENT_WIDTH) {
      pieces.push(current);
      current = char;
      continue;
    }
    current += char;
  }
  if (current.length > 0) {
    pieces.push(current);
  }
  return pieces;
}

function paginate(lines: string[]): string[][] {
  const capacity = linesPerPage();
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += capacity) {
    pages.push(lines.slice(index, index + capacity));
  }
  return pages.length > 0 ? pages : [[]];
}

function linesPerPage(): number {
  let count = 0;
  for (let y = FIRST_BASELINE; y >= MARGIN; y -= LEADING) {
    count += 1;
  }
  return count;
}

function buildObjects(pages: string[][]): Buffer[] {
  const kids = pages.map((_, index) => `${pageObjectId(index)} 0 R`).join(' ');
  const objects = [
    pdfObject(1, '<< /Type /Catalog /Pages 2 0 R >>'),
    pdfObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`),
    pdfObject(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),
  ];
  pages.forEach((page, index) => {
    objects.push(pdfObject(pageObjectId(index), pageDictionary(contentObjectId(index))));
    objects.push(pdfStreamObject(contentObjectId(index), pageStream(page)));
  });
  return objects;
}

function pageDictionary(contentId: number): string {
  return (
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
    `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
  );
}

function pageStream(lines: string[]): Buffer {
  const commands = ['BT', `/F1 ${FONT_SIZE} Tf`, `${LEADING} TL`, `${MARGIN} ${FIRST_BASELINE} Td`];
  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push('T*');
    }
    commands.push(`(${escapePdfText(line)}) Tj`);
  });
  commands.push('ET');
  return Buffer.from(`${commands.join('\n')}\n`, 'latin1');
}

function escapePdfText(input: string): string {
  return toWinAnsi(input).replace(/\\/gu, '\\\\').replace(/\(/gu, '\\(').replace(/\)/gu, '\\)');
}

function toWinAnsi(input: string): string {
  let encoded = '';
  for (const char of input) {
    encoded += char.charCodeAt(0) <= 0xff ? char : '?';
  }
  return encoded;
}

function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += (charWidthUnits(char) / 1000) * FONT_SIZE;
  }
  return width;
}

function charWidthUnits(char: string): number {
  const direct = HELVETICA_WIDTHS[char];
  if (direct !== undefined) {
    return direct;
  }
  const base = char.normalize('NFD').replace(/\p{M}/gu, '');
  return HELVETICA_WIDTHS[base] ?? 600;
}

function pageObjectId(index: number): number {
  return 4 + index * 2;
}

function contentObjectId(index: number): number {
  return 5 + index * 2;
}

function pdfObject(id: number, body: string): Buffer {
  return Buffer.from(`${id} 0 obj\n${body}\nendobj\n`, 'latin1');
}

function pdfStreamObject(id: number, stream: Buffer): Buffer {
  const head = Buffer.from(`${id} 0 obj\n<< /Length ${stream.length} >>\nstream\n`, 'latin1');
  const tail = Buffer.from('\nendstream\nendobj\n', 'latin1');
  return Buffer.concat([head, stream, tail]);
}

function assemblePdf(objects: Buffer[]): Buffer {
  const header = Buffer.concat([
    Buffer.from('%PDF-1.4\n%', 'ascii'),
    Buffer.from([0xe2, 0xe3, 0xcf, 0xd3]),
    Buffer.from('\n', 'ascii'),
  ]);
  const offsets = [0];
  let cursor = header.length;
  const chunks: Buffer[] = [header];
  for (const object of objects) {
    offsets.push(cursor);
    chunks.push(object);
    cursor += object.length;
  }
  chunks.push(Buffer.from(buildXref(offsets, cursor), 'latin1'));
  return Buffer.concat(chunks);
}

function buildXref(offsets: number[], xrefOffset: number): string {
  const entries = offsets
    .map((offset, index) => (index === 0 ? '0000000000 65535 f \n' : `${offset.toString().padStart(10, '0')} 00000 n \n`))
    .join('');
  const trailer = `<< /Size ${offsets.length} /Root 1 0 R >>`;
  return `xref\n0 ${offsets.length}\n${entries}trailer\n${trailer}\nstartxref\n${xrefOffset}\n%%EOF\n`;
}
