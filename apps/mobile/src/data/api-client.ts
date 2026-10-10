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

export function isDayChangeConfirmationRequired(error: unknown): boolean {
  if (!(error instanceof ApiClientError) || error.status !== 409) {
    return false;
  }
  return error.message.includes('DAY_CHANGE_CONFIRMATION_REQUIRED');
}

export function createApiClient(config: ApiClientOptions) {
  const baseUrl = resolveBaseUrl(config.baseUrl);
  const send = <T>(request: RequestOptions): Promise<T> => executeRequest<T>(baseUrl, config, request);
  return {
    delete: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
      send<T>({
        body,
        headers,
        method: 'DELETE',
        path,
      }),
    get: <T>(path: string, headers?: Record<string, string>): Promise<T> => send<T>({ headers, method: 'GET', path }),
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
  const response = await fetch(`${baseUrl}${request.path}`, {
    body: serializeBody(request.body),
    headers,
    method: request.method,
  });
  if (!response.ok) {
    throw await rejectResponse(response, request.method, request.path, headers['X-Request-Id']);
  }
  return (await response.json()) as T;
}

function resolveBaseUrl(baseUrl?: string): string {
  if (baseUrl) {
    return baseUrl;
  }
  // Direct `process.env.EXPO_PUBLIC_*` access so the bundler can inline it at
  // build time (both native and web). Indirect access via a helper is NOT
  // inlined and falls back to localhost on web.
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
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

export function deviceTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function buildHeaders(config: ApiClientOptions, body?: unknown, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Active-Role': config.activeRole,
    'X-Request-Id': createRequestId(),
    'X-Timezone-Offset': String(deviceTimezoneOffsetMinutes()),
    ...(extra ?? {}),
  };
  if (config.accessToken) {
    headers.Authorization = `Bearer ${config.accessToken}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
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
