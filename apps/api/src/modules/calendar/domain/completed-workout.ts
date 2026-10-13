export function completedDayKey(clientId: string | null, date: Date): string {
  return `${clientId ?? ''}|${date.toISOString().slice(0, 10)}`;
}

export function completedWorkoutKey(clientId: string | null, date: Date, planDayId: string): string {
  return `${completedDayKey(clientId, date)}|${planDayId}`;
}

export function rememberCompletedSession(keys: Set<string>, clientId: string, date: Date, planDayId: string | null): void {
  keys.add(completedDayKey(clientId, date));
  if (planDayId) keys.add(completedWorkoutKey(clientId, date, planDayId));
}

/** Un entrenamiento con día de plan solo está hecho si esa sesión concreta lo está. Sin día de plan, basta el día. */
export function isWorkoutCompleted(
  keys: Set<string>,
  clientId: string | null,
  date: Date,
  planDayId: string | null,
): boolean {
  if (planDayId) return keys.has(completedWorkoutKey(clientId, date, planDayId));
  return keys.has(completedDayKey(clientId, date));
}
