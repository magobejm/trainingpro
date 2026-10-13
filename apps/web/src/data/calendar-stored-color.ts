import { lightColors } from '@trainerpro/ui';

/** Calendar colors cross the API/mobile boundary and must remain literal colors. */
export function calendarStoredColor(value: string | undefined): string | undefined {
  if (!value) return value;
  const token = /^var\(--tp-([A-Za-z]+)(?:,[^)]+)?\)$/.exec(value)?.[1];
  return token && token in lightColors ? lightColors[token as keyof typeof lightColors] : value;
}
