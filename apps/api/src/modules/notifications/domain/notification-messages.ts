export type PushMessage = {
  body: string;
  channelId: string;
  data: Record<string, string>;
  title: string;
  to: string;
};

const COPY: Record<string, { body: string; title: string }> = {
  ADHERENCE_LOW_WEEKLY: {
    body: 'Un cliente ha completado menos de la mitad de sus sesiones esta semana.',
    title: 'Adherencia baja',
  },
  CLIENT_INACTIVE_3D: {
    body: 'Un cliente lleva tres días sin registrar una sesión.',
    title: 'Cliente inactivo',
  },
  CLIENT_REMINDER: {
    body: 'Tienes una sesión pendiente hoy.',
    title: 'Entrenamiento de hoy',
  },
  INCIDENT_CRITICAL: {
    body: 'Se ha registrado una incidencia crítica.',
    title: 'Incidencia grave',
  },
  SESSION_COMPLETED: {
    body: 'Un cliente ha terminado su sesión.',
    title: 'Sesión completada',
  },
};

export function buildPushMessage(input: {
  clientId?: string | null;
  eventId: string;
  payload: Record<string, unknown> | null;
  recipientUserId?: string | null;
  token: string;
  topic: string;
}): PushMessage {
  const copy = COPY[input.topic] ?? {
    body: 'Tienes un aviso nuevo.',
    title: 'Trainer Pro',
  };
  return {
    body: copy.body,
    channelId: 'default',
    data: buildData(input),
    title: copy.title,
    to: input.token,
  };
}

function buildData(input: {
  clientId?: string | null;
  eventId: string;
  payload: Record<string, unknown> | null;
  recipientUserId?: string | null;
  topic: string;
}): Record<string, string> {
  const data: Record<string, string> = {
    eventId: input.eventId,
    topic: input.topic,
  };
  assignIfPresent(data, 'clientId', input.clientId);
  assignIfPresent(data, 'recipientUserId', input.recipientUserId);
  assignIfPresent(data, 'sessionId', readString(input.payload?.sessionId));
  assignIfPresent(data, 'incidentId', readString(input.payload?.incidentId));
  return data;
}

function assignIfPresent(data: Record<string, string>, key: string, value: string | null | undefined): void {
  if (value) {
    data[key] = value;
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
