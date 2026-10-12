import { afterAll, describe, expect, it } from 'vitest';
import { ApiClientError, createApiClient, type ActiveRole } from '../src/data/api-client';
import { loginWithPassword } from '../src/data/auth-service';
import { readFlowGate } from './flow-env';

const COACH_EMAIL = 'coach1@example.com';
const CLIENT_EMAIL = 'client5.coach1@example.com';

type FlowState = {
  clientId: string;
  clientToken: string;
  coachToken: string;
  email: string;
  templateId: string;
};

type MeProfile = { email: string; roles: string[] };

const gate = await readFlowGate();
if (!gate.ok) console.warn(gate.notice);

const apiBase = gate.ok ? gate.apiBase : 'http://127.0.0.1:8080';
const state: FlowState = { clientId: '', clientToken: '', coachToken: '', email: '', templateId: '' };

describe.skipIf(!gate.ok)('flujos web mas usados', () => {
  afterAll(() => cleanupCreated(apiBase, state));

  it('entra el entrenador con su rol', () => loginCoach(apiBase, state));
  it('entra el cliente con su rol', () => loginClient(apiBase, state));
  it('rechaza un rol que no corresponde', () => rejectForeignRoles(apiBase, state));
  it('da de alta un cliente y lo lee', () => createClientFlow(apiBase, state));
  it('guarda una rutina vacia y la lee', () => saveRoutineFlow(apiBase, state));
  it('asigna la rutina y la lee en el cliente', () => assignRoutineFlow(apiBase, state));
  it('guarda un mensaje de chat y lo lee', () => sendChatFlow(apiBase, state));
  it('descarga el PDF del informe', () => downloadPdfFlow(apiBase, state));
  it('archiva el cliente y deja de estar activo', () => archiveClientFlow(apiBase, state));
});

function coachApi(base: string, token: string) {
  return createApiClient({ accessToken: token, activeRole: 'coach', baseUrl: base });
}

async function signIn(email: string, passwordEnv: 'TP_CLIENT_PASSWORD' | 'TP_COACH_PASSWORD'): Promise<string> {
  const password = process.env[passwordEnv];
  if (!password) throw new Error('Missing test password');
  return (await loginWithPassword(email, password)).accessToken;
}

async function readMe(base: string, token: string, role: ActiveRole): Promise<MeProfile> {
  return createApiClient({ accessToken: token, activeRole: role, baseUrl: base }).get<MeProfile>('/users/me');
}

async function loginCoach(base: string, current: FlowState): Promise<void> {
  current.coachToken = await signIn(COACH_EMAIL, 'TP_COACH_PASSWORD');
  const me = await readMe(base, current.coachToken, 'coach');
  expect(me.email).toBe(COACH_EMAIL);
  expect(me.roles.map((role) => role.toLowerCase())).toContain('coach');
}

async function loginClient(base: string, current: FlowState): Promise<void> {
  current.clientToken = await signIn(CLIENT_EMAIL, 'TP_CLIENT_PASSWORD');
  const me = await readMe(base, current.clientToken, 'client');
  expect(me.email).toBe(CLIENT_EMAIL);
  expect(me.roles.map((role) => role.toLowerCase())).toContain('client');
}

async function rejectForeignRoles(base: string, current: FlowState): Promise<void> {
  await expectRoleRejected(base, current.coachToken, 'client');
  await expectRoleRejected(base, current.clientToken, 'coach');
}

async function expectRoleRejected(base: string, token: string, role: ActiveRole): Promise<void> {
  try {
    await readMe(base, token, role);
    throw new Error('El rol no fue rechazado');
  } catch (error) {
    if (error instanceof Error && error.message === 'El rol no fue rechazado') throw error;
    expect(error).toBeInstanceOf(ApiClientError);
    expect([401, 403]).toContain((error as ApiClientError).status);
  }
}

async function createClientFlow(base: string, current: FlowState): Promise<void> {
  current.email = `tp21-${Date.now()}@example.com`;
  expect(current.email).not.toBe(CLIENT_EMAIL);
  const created = await coachApi(base, current.coachToken).post<{ client: { email: string; id: string } }>('/clients', {
    email: current.email,
    firstName: 'TP21',
    lastName: 'Flujo',
  });
  current.clientId = created.client.id;
  const detail = await coachApi(base, current.coachToken).get<{ email: string }>(`/clients/${current.clientId}`);
  expect(detail.email).toBe(current.email);
}

async function saveRoutineFlow(base: string, current: FlowState): Promise<void> {
  const name = `TP21 ${Date.now()}`;
  const saved = await coachApi(base, current.coachToken).post<{ id: string }>('/plans/templates/routines', {
    days: [{ dayIndex: 1, title: 'Dia 1' }],
    name,
  });
  current.templateId = saved.id;
  const loaded = await coachApi(base, current.coachToken).get<{ name: string }>(`/plans/templates/routines/${saved.id}`);
  expect(loaded.name).toBe(name);
}

async function assignRoutineFlow(base: string, current: FlowState): Promise<void> {
  await coachApi(base, current.coachToken).patch(`/clients/${current.clientId}`, { trainingPlanId: current.templateId });
  const detail = await coachApi(base, current.coachToken).get<{ trainingPlanId: string | null }>(
    `/clients/${current.clientId}`,
  );
  expect(detail.trainingPlanId).toBe(current.templateId);
}

async function sendChatFlow(base: string, current: FlowState): Promise<void> {
  const api = coachApi(base, current.coachToken);
  const thread = await api.get<{ id: string }>('/chat/thread', { clientId: current.clientId });
  const text = `tp21-${Date.now()}`;
  await api.post('/chat/messages', { text, threadId: thread.id });
  const messages = await api.get<Array<{ text: string | null }>>('/chat/messages', { threadId: thread.id });
  expect(messages.some((message) => message.text === text)).toBe(true);
}

async function downloadPdfFlow(base: string, current: FlowState): Promise<void> {
  const day = todayKey();
  const url = new URL('/reports/export/pdf', base);
  url.searchParams.set('clientId', current.clientId);
  url.searchParams.set('from', day);
  url.searchParams.set('to', day);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${current.coachToken}`, 'X-Active-Role': 'coach' },
  });
  expect(response.status).toBe(200);
  const header = new TextDecoder().decode(new Uint8Array(await response.arrayBuffer()).slice(0, 4));
  expect(header).toBe('%PDF');
}

async function archiveClientFlow(base: string, current: FlowState): Promise<void> {
  expect(current.email.startsWith('tp21-')).toBe(true);
  expect(current.email).not.toBe(CLIENT_EMAIL);
  const api = coachApi(base, current.coachToken);
  const archived = await api.delete<{ status: string }>(`/clients/${current.clientId}`);
  expect(archived.status).toBe('archived');
  await expect(api.get(`/clients/${current.clientId}`)).rejects.toMatchObject({ status: 403 });
  const list = await api.get<{ items: Array<{ email: string }> }>('/clients');
  expect(list.items.some((item) => item.email === current.email)).toBe(false);
}

async function cleanupCreated(base: string, current: FlowState): Promise<void> {
  if (!current.coachToken || !current.email.startsWith('tp21-') || current.email === CLIENT_EMAIL) return;
  const api = coachApi(base, current.coachToken);
  if (current.clientId) await settle(() => api.delete(`/clients/${current.clientId}`));
  if (current.templateId) await settle(() => api.delete(`/plans/templates/routines/${current.templateId}`));
}

async function settle(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch {
    return;
  }
}

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
