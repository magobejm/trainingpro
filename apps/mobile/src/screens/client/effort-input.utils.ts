const RPE_DRAFT = /^(?:[1-9]|10)(?:[.,](?:[05])?)?$/;
const RPE_COMPLETE = /^(?:[1-9]|10)(?:[.,][05])?$/;
const RIR_DRAFT = /^(?:0|[1-9]|10)$/;

export function sanitizeRpeInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (RPE_DRAFT.test(trimmed) && rpeWithinRange(trimmed)) return trimmed;
  return sanitizeRpeInput(trimmed.slice(0, -1));
}

export function completeRpeValue(raw: string): null | number {
  const sanitized = sanitizeRpeInput(raw);
  if (!RPE_COMPLETE.test(sanitized)) return null;
  const value = Number(sanitized.replace(',', '.'));
  if (!Number.isFinite(value) || value < 1 || value > 10) return null;
  return value;
}

export function sanitizeRirInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (RIR_DRAFT.test(trimmed)) return trimmed;
  return sanitizeRirInput(trimmed.slice(0, -1));
}

function rpeWithinRange(text: string): boolean {
  const whole = Number(text.split(/[.,]/)[0]);
  if (whole < 1 || whole > 10) return false;
  const fraction = text.split(/[.,]/)[1];
  if (fraction === '5' && whole === 10) return false;
  return true;
}
