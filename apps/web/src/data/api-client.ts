export type ActiveRole = 'admin' | 'coach' | 'client';

export type ApiClientOptions = {
  activeRole: ActiveRole;
  accessToken?: string;
  baseUrl?: string;
};

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  path: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class UnauthorizedApiError extends ApiClientError {}
export class ForbiddenApiError extends ApiClientError {}

export const UNAUTHORIZED_EVENT = 'trainerpro:unauthorized';

export function createApiClient(config: ApiClientOptions) {
  const baseUrl = resolveBaseUrl(config.baseUrl);
  const send = <T>(request: RequestOptions): Promise<T> =>
    executeRequest<T>(baseUrl, config, request);
  return {
    delete: <T>(path: string, headers?: Record<string, string>): Promise<T> => send<T>({
      headers,
      method: 'DELETE',
      path,
    }),
    get: <T>(path: string, headers?: Record<string, string>): Promise<T> =>
      send<T>({ headers, method: 'GET', path }),
    patch: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'PATCH', path }),
    post: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'POST', path }),
    put: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'PUT', path }),
  };
}

async function executeRequest<T>(
  baseUrl: string,
  config: ApiClientOptions,
  request: RequestOptions,
): Promise<T> {
  const headers = buildHeaders(config, request.body, request.headers);
  const response = await fetch(`${baseUrl}${request.path}`, {
    body: serializeBody(request.body),
    headers,
    method: request.method,
  });
  await throwIfUnauthorized(response);
  if (!response.ok) {
    const payload = await safeReadText(response);
    throw new ApiClientError(payload || 'Unexpected API error', response.status);
  }
  return (await response.json()) as T;
}

function resolveBaseUrl(baseUrl?: string): string {
  if (baseUrl) {
    return baseUrl;
  }
  const env = readFrontEnv();
  return env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
}

function readFrontEnv(): Record<string, string | undefined> {
  return {
    ...readProcessEnv(),
    ...readImportMetaEnv(),
  };
}

function readImportMetaEnv(): Record<string, string | undefined> {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  return meta.env ?? {};
}

function readProcessEnv(): Record<string, string | undefined> {
  const scope = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return scope.process?.env ?? {};
}

async function throwIfUnauthorized(response: Response): Promise<void> {
  if (response.status === 401) {
    emitUnauthorizedEvent();
    throw new UnauthorizedApiError('Unauthorized', 401);
  }
  if (response.status === 403) {
    throw new ForbiddenApiError('Forbidden', 403);
  }
}

function emitUnauthorizedEvent(): void {
  const scope = globalThis as { dispatchEvent?: (event: Event) => void };
  if (!scope.dispatchEvent || typeof Event === 'undefined') {
    return;
  }
  scope.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

function buildHeaders(
  config: ApiClientOptions,
  body?: unknown,
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Active-Role': config.activeRole,
    ...(extra ?? {}),
  };
  const accessToken = resolveAccessToken(config);
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function resolveAccessToken(config: ApiClientOptions): string | undefined {
  if (config.accessToken) {
    return config.accessToken;
  }
  return readPersistedAccessToken();
}

function readPersistedAccessToken(): string | undefined {
  const scope = globalThis as { localStorage?: Storage };
  const raw = scope.localStorage?.getItem('trainerpro.web.auth');
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed.state?.accessToken;
  } catch {
    return undefined;
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function serializeBody(body?: unknown): string | undefined {
  return body === undefined ? undefined : JSON.stringify(body);
}
