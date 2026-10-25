/** Reads the exercise name back from the client's chat notice ("🎯 Ejercicio: Sentadilla"). */
export function extractExerciseName(text: null | string | undefined): string | undefined {
  const match = /🎯 Ejercicio:\s*(.+)/.exec(text ?? '');
  const name = match?.[1]?.trim();
  return name ? name.slice(0, 120) : undefined;
}
