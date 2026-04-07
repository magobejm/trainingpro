/** Normalize DB/API plan template ids for PATCH /clients (trainingPlanId). */
const HYPHENATED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THIRTY_TWO = /^[0-9a-f]{32}$/i;

export function normalizePlanTemplateId(value: string): string | undefined {
  const t = value.trim().toLowerCase();
  if (t === '' || t === 'null' || t === 'undefined') return undefined;
  if (THIRTY_TWO.test(t)) {
    return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
  }
  if (HYPHENATED.test(t)) {
    return t;
  }
  return undefined;
}

/** First matching normalized id among candidates (e.g. editingId vs sourcePlanTemplateId). */
export function pickNormalizedPlanTemplateId(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (typeof c !== 'string' || c.length === 0) continue;
    const n = normalizePlanTemplateId(c);
    if (n) return n;
  }
  return null;
}
