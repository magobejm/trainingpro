export const ROM_SCALE_VALUES = ['completo', 'parcial', 'minimo'] as const;

export type RomScaleValue = (typeof ROM_SCALE_VALUES)[number];

export function isRomScaleValue(value: string): value is RomScaleValue {
  return (ROM_SCALE_VALUES as readonly string[]).includes(value);
}
