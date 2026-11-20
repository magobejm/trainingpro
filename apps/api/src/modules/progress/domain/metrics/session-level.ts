export function positiveOrNull(value: null | number | undefined): null | number {
  return typeof value === 'number' && value > 0 ? value : null;
}

/** Minutos de la sesión: marcas de inicio y fin; si no valen, la duración registrada al terminar. */
export function resolveDurationMinutes(
  startedAt: Date | null,
  finishedAt: Date | null,
  performedDurationSeconds: null | number | undefined,
): null | number {
  if (startedAt && finishedAt && finishedAt > startedAt) {
    return Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);
  }
  const performed = positiveOrNull(performedDurationSeconds);
  return performed === null ? null : Math.round(performed / 60);
}

/** Carga sRPE de la sesión: valoración de la sesión por minutos. */
export function sessionLoadFromRpe(sessionRpe: null | number, durationMinutes: null | number): null | number {
  if (sessionRpe === null || sessionRpe <= 0 || durationMinutes === null || durationMinutes <= 0) return null;
  return Math.round(sessionRpe * durationMinutes * 100) / 100;
}
