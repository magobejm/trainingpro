export type CardioMethodTypeSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const CARDIO_METHOD_TYPES_V1: CardioMethodTypeSeed[] = [
  { code: 'sin_definir', isDefault: true, label: 'Sin definir', sortOrder: 0 },
  { code: 'calentamiento', isDefault: false, label: 'Calentamiento', sortOrder: 10 },
  { code: 'continuo_extensivo', isDefault: false, label: 'Continuo extensivo', sortOrder: 20 },
  { code: 'continuo_intensivo', isDefault: false, label: 'Continuo intensivo', sortOrder: 30 },
  { code: 'intervalos_aerobicos_extensivos', isDefault: false, label: 'Intervalos aeróbicos extensivos', sortOrder: 40 },
  { code: 'intervalos_intensivos', isDefault: false, label: 'Intervalos intensivos', sortOrder: 50 },
  { code: 'tempo_umbral', isDefault: false, label: 'Tempo/Umbral', sortOrder: 60 },
  { code: 'hiit_corto', isDefault: false, label: 'HIIT corto', sortOrder: 70 },
  { code: 'hiit_largo', isDefault: false, label: 'HIIT largo', sortOrder: 80 },
  { code: 'anaerobico_lactico', isDefault: false, label: 'Anaeróbico láctico', sortOrder: 90 },
  { code: 'fartlek', isDefault: false, label: 'Fartlek', sortOrder: 100 },
];
