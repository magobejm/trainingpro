export type Sample = { bytes: number; ms: number; queries: number; status: number };

export type EndpointReport = {
  bytes: number;
  error?: string;
  explain?: string;
  medianMs: number;
  p95Ms: number;
  queries: number;
  status: number;
};

export function summarize(samples: Sample[]): Pick<EndpointReport, 'bytes' | 'medianMs' | 'p95Ms' | 'queries' | 'status'> {
  const ok = samples.filter((sample) => sample.status < 400);
  const source = ok.length > 0 ? ok : samples;
  const times = source.map((sample) => sample.ms).sort((a, b) => a - b);
  const last = source[source.length - 1] ?? samples[0];
  return {
    bytes: last?.bytes ?? 0,
    medianMs: percentile(times, 50),
    p95Ms: percentile(times, 95),
    queries: median(source.map((sample) => sample.queries)),
    status: last?.status ?? 0,
  };
}

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return Math.round(sorted[Math.max(0, index)] ?? 0);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 50);
}

export function bindParams(sql: string, paramsJson: string): string {
  const params = JSON.parse(paramsJson) as unknown[];
  let bound = sql;
  for (let index = params.length; index >= 1; index -= 1) {
    bound = bound.replaceAll(`$${index}`, sqlLiteral(params[index - 1]));
  }
  return bound;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replaceAll("'", "''")}'`;
}
