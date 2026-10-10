export type RequestLogEvent = {
  durationMs: number;
  errorName?: string;
  message?: string;
  method: string;
  module: string;
  prismaCode?: string;
  requestId: string;
  route: string;
  status: number;
};

export function writeRequestLog(event: RequestLogEvent): void {
  const line: Record<string, number | string> = {
    durationMs: event.durationMs,
    method: event.method,
    module: event.module,
    requestId: event.requestId,
    route: event.route,
    status: event.status,
  };
  if (event.message !== undefined) {
    line.message = event.message;
  }
  if (event.errorName !== undefined) {
    line.errorName = event.errorName;
  }
  if (event.prismaCode !== undefined) {
    line.prismaCode = event.prismaCode;
  }
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export function publicLogMessage(message: unknown): string | undefined {
  const text = messageText(message);
  if (!text) {
    return undefined;
  }
  return text.replace(/bearer\s+\S+/gi, 'bearer [redacted]');
}

function messageText(message: unknown): string | undefined {
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (!Array.isArray(message)) {
    return undefined;
  }
  const text = message.filter((item) => typeof item === 'string').join('; ');
  return text.length > 0 ? text : undefined;
}
