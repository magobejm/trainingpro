import { coachDocumentHtml } from '../coach-document';
import { acceptEvaluatorFile } from '../coach-evaluator-model';
describe('coach documents and evaluator input', () => {
  it('escapes user content and preserves visible line breaks in printable HTML', () => {
    const html = coachDocumentHtml('<script>', [{ title: 'A & B', lines: ['<img onerror=alert(1)>', 'uno\ndos'] }]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('uno<br>dos');
  });
  it('accepts supported extensions when native picker lacks MIME and rejects oversized files', () => {
    expect(acceptEvaluatorFile({ name: 'video.MOV', size: 1024, mimeType: undefined })).toBe('video/quicktime');
    expect(acceptEvaluatorFile({ name: 'a.exe', size: 100, mimeType: 'application/octet-stream' })).toBeNull();
    expect(acceptEvaluatorFile({ name: 'a.png', size: 21 * 1024 * 1024, mimeType: 'image/png' })).toBeNull();
    expect(acceptEvaluatorFile({ name: 'a.png', size: undefined, mimeType: 'image/png' })).toBeNull();
  });
});
