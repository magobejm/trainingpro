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
  params?: Record<string, string>;
};

export class ApiClientError extends Error {
  readonly requestId?: string;
  readonly responseText: string;

  constructor(
    message: string,
    public readonly status: number,
    requestId?: string,
    responseText?: string,
  ) {
    super(message);
    this.requestId = requestId;
    this.responseText = responseText ?? message;
  }
}

export class UnauthorizedApiError extends ApiClientError {}
export class ForbiddenApiError extends ApiClientError {}

export const UNAUTHORIZED_EVENT = 'trainerpro:unauthorized';

export function createApiClient(config: ApiClientOptions) {
  const baseUrl = resolveBaseUrl(config.baseUrl);
  const send = <T>(request: RequestOptions): Promise<T> => executeRequest<T>(baseUrl, config, request);
  return {
    delete: <T>(path: string, headers?: Record<string, string>): Promise<T> =>
      send<T>({
        headers,
        method: 'DELETE',
        path,
      }),
    get: <T>(path: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> =>
      send<T>({ headers, method: 'GET', path, params }),
    patch: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'PATCH', path }),
    post: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'POST', path }),
    put: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({ body, headers, method: 'PUT', path }),
  };
}

async function executeRequest<T>(baseUrl: string, config: ApiClientOptions, request: RequestOptions): Promise<T> {
  const headers = buildHeaders(config, request.body, request.headers);
  const url = buildUrl(baseUrl, request.path, request.params);
  const response = await fetch(url, {
    body: serializeBody(request.body),
    headers,
    method: request.method,
  });
  if (!response.ok) {
    throw await rejectResponse(response, request.method, request.path, headers['X-Request-Id']);
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
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
  return {
    EXPO_PUBLIC_API_BASE_URL: import.meta.env?.EXPO_PUBLIC_API_BASE_URL as string | undefined,
  };
}

function readProcessEnv(): Record<string, string | undefined> {
  const scope = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return scope.process?.env ?? {};
}

async function rejectResponse(
  response: Response,
  method: string,
  path: string,
  sentRequestId: string | undefined,
): Promise<ApiClientError> {
  const payload = await safeReadText(response);
  const requestId = response.headers.get('x-request-id') || sentRequestId;
  const message = readPublicMessage(payload, fallbackMessage(response.status));
  logClientFailure({ method, path, requestId, status: response.status });
  if (response.status === 401) {
    emitUnauthorizedEvent();
    return new UnauthorizedApiError(message, 401, requestId, payload);
  }
  if (response.status === 403) {
    return new ForbiddenApiError(message, 403, requestId, payload);
  }
  return new ApiClientError(message, response.status, requestId, payload);
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  return 'Unexpected API error';
}

function readPublicMessage(payload: string, fallback: string): string {
  if (!payload) return fallback;
  try {
    const parsed = JSON.parse(payload) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message;
    if (Array.isArray(parsed.message)) {
      const text = parsed.message.filter((item) => typeof item === 'string').join('; ');
      if (text) return text;
    }
  } catch {
    return payload;
  }
  return fallback;
}

function logClientFailure(event: { method: string; path: string; requestId?: string; status: number }): void {
  console.warn(
    JSON.stringify({
      method: event.method,
      path: event.path,
      requestId: event.requestId,
      status: event.status,
    }),
  );
}

function emitUnauthorizedEvent(): void {
  const scope = globalThis as { dispatchEvent?: (event: Event) => void };
  if (!scope.dispatchEvent || typeof Event === 'undefined') {
    return;
  }
  scope.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

function buildHeaders(config: ApiClientOptions, body?: unknown, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Active-Role': config.activeRole,
    'X-Request-Id': createRequestId(),
    ...(extra ?? {}),
  };
  const accessToken = resolveAccessToken(config);
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function createRequestId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) {
    return randomUUID();
  }
  return fallbackRequestId();
}

function fallbackRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
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

function serializeBody(body?: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
}
