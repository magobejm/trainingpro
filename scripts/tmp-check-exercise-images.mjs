import { readFileSync, writeFileSync } from 'node:fs';

function loadEnv(path) {
  const text = readFileSync(path, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return env;
}

const apiEnv = loadEnv('apps/api/.env.local');
const webEnv = loadEnv('apps/web/.env.local');
const supabaseUrl = apiEnv.SUPABASE_URL.replace(/\/$/, '');
const serviceKey = apiEnv.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = webEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function sessionFor(email) {
  const link = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email }),
  });
  if (!link.ok) throw new Error(`link ${email} ${link.status}`);
  const linked = await link.json();
  const verified = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: linked.hashed_token }),
  });
  if (!verified.ok) throw new Error(`verify ${email} ${verified.status} ${await verified.text()}`);
  return verified.json();
}

function summarize(items, label) {
  const urls = items
    .map((item) => item.mediaUrl ?? item.media?.url ?? null)
    .filter((url) => typeof url === 'string' && url.length > 0);
  const absolute = urls.filter((url) => url.startsWith('http://localhost:8080/assets/exercises/'));
  const relative = urls.filter((url) => url.startsWith('/assets/exercises/'));
  return {
    label,
    total: items.length,
    withUrl: urls.length,
    absolute: absolute.length,
    relative: relative.length,
    sample: absolute[0] ?? urls[0] ?? null,
  };
}

const coach = await sessionFor('coach1@example.com');
const client = await sessionFor('client5.coach1@example.com');

async function apiGet(path, token, role) {
  const response = await fetch(`http://localhost:8080${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'X-Active-Role': role },
  });
  const body = await response.json();
  return { status: response.status, body };
}

const coachList = await apiGet('/library/exercises/all', coach.access_token, 'coach');
const clientList = await apiGet('/clients/me/library/exercises', client.access_token, 'client');
const coachItems = Array.isArray(coachList.body) ? coachList.body : coachList.body.items ?? [];
const clientItems = Array.isArray(clientList.body) ? clientList.body : clientList.body.items ?? [];
const coachSummary = summarize(coachItems.filter((item) => item.kind === 'exercise' || !item.kind), 'coach-strength');
const clientSummary = summarize(clientItems, 'client-strength');

const sample = coachSummary.sample ?? clientSummary.sample;
let image = null;
if (sample) {
  const response = await fetch(sample);
  const bytes = Buffer.from(await response.arrayBuffer());
  image = {
    status: response.status,
    type: response.headers.get('content-type'),
    bytes: bytes.length,
    webp: bytes[0] === 0x52 && bytes[1] === 0x49,
  };
}

const report = {
  coachStatus: coachList.status,
  clientStatus: clientList.status,
  coachSummary,
  clientSummary,
  image,
};
writeFileSync('scripts/tmp-check-exercise-images.json', JSON.stringify(report, null, 2));
writeFileSync(
  'scripts/tmp-check-sessions.json',
  JSON.stringify({
    coach: { access_token: coach.access_token, refresh_token: coach.refresh_token },
    client: { access_token: client.access_token, refresh_token: client.refresh_token },
  }),
);
console.log(JSON.stringify(report, null, 2));
