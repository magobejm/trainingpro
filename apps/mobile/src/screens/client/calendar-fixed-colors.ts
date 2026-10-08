export const COACH_NOTE_COLOR = '#172554';
export const CALL_COLOR = '#065f46';
export const CLIENT_NOTE_COLOR = '#92400e';
export const CALL_REQUEST_COLOR = '#3b0764';

/** Cuartos de hora de 08:00 a 21:45, los mismos que admite la API. */
export function callTimeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = 8 * 60; minutes <= 21 * 60 + 45; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    options.push(`${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`);
  }
  return options;
}

export const QUICK_CALL_TIMES = ['09:00', '12:30', '17:15', '18:00', '19:30', '20:45'];
