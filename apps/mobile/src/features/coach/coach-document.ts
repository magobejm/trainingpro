export type CoachDocumentSection = { title: string; lines: string[] };
export function escapeCoachHtml(text: string): string {
  return text
    .replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
    .replace(/\r?\n/g, '<br>');
}
export function coachDocumentHtml(title: string, sections: CoachDocumentSection[]): string {
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
    escapeCoachHtml(title) +
    '</title><style>body{font:15px system-ui,sans-serif;color:#172554;padding:32px;line-height:1.5}h1{color:#1d4ed8}section{break-inside:avoid;margin:24px 0}h2{border-bottom:1px solid #bfdbfe;padding-bottom:8px}p{margin:6px 0}@page{margin:18mm}</style></head><body><h1>' +
    escapeCoachHtml(title) +
    '</h1>' +
    sections
      .map(
        (section) =>
          '<section><h2>' +
          escapeCoachHtml(section.title) +
          '</h2>' +
          section.lines.map((line) => '<p>' + escapeCoachHtml(line) + '</p>').join('') +
          '</section>',
      )
      .join('') +
    '</body></html>'
  );
}
