import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_API = 'http://127.0.0.1:8080';

export const FLOW_NOTICE =
  'TP-21: suite omitida. Faltan las contraseñas de prueba o el entorno de Supabase, o la API local no responde.';

export type FlowGate = { apiBase: string; ok: true } | { notice: string; ok: false };

export function loadLocalEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const filePath of [
    resolve(here, '../../../.env'),
    resolve(here, '../.env'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ]) {
    applyEnvFile(filePath);
  }
}

export async function readFlowGate(): Promise<FlowGate> {
  loadLocalEnv();
  if (!hasFlowSecrets()) {
    return { notice: FLOW_NOTICE, ok: false };
  }
  const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API).replace(/\/$/, '');
  if (!(await probeHealth(apiBase))) {
    return { notice: FLOW_NOTICE, ok: false };
  }
  return { apiBase, ok: true };
}

function hasFlowSecrets(): boolean {
  return Boolean(
    process.env.TP_COACH_PASSWORD &&
    process.env.TP_CLIENT_PASSWORD &&
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function probeHealth(apiBase: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(4_000) });
    return response.ok;
  } catch {
    return false;
  }
}

function applyEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed || process.env[parsed.key]) continue;
    process.env[parsed.key] = parsed.value;
  }
}

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eq = trimmed.indexOf('=');
  if (eq < 1) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'")) && value.at(-1) === value[0]) {
    value = value.slice(1, -1);
  }
  return { key, value };
}
