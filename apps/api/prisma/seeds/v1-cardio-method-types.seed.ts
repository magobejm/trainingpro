export type CardioMethodTypeSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const CARDIO_METHOD_TYPES_V1: CardioMethodTypeSeed[] = [
  { code: 'undefined', isDefault: true, label: 'Sin definir', sortOrder: 0 },
  { code: 'activacion', isDefault: false, label: 'Activacion', sortOrder: 10 },
  { code: 'maquinas_cardio', isDefault: false, label: 'Maquinas de cardio', sortOrder: 20 },
  { code: 'continuo_extensivo', isDefault: false, label: 'Continuo extensivo', sortOrder: 30 },
  { code: 'continuo_intensivo', isDefault: false, label: 'Continuo intensivo', sortOrder: 40 },
  { code: 'intervalos_aerobicos_extensivos', isDefault: false, label: 'Intervalos aerobicos extensivos', sortOrder: 50 },
  { code: 'intervalos_intensivos', isDefault: false, label: 'Intervalos intensivos', sortOrder: 60 },
  { code: 'tempo_umbral', isDefault: false, label: 'Tempo/Umbral', sortOrder: 70 },
  { code: 'hiit_corto', isDefault: false, label: 'HIIT corto', sortOrder: 80 },
  { code: 'hiit_largo', isDefault: false, label: 'HIIT largo', sortOrder: 90 },
  { code: 'anaerobico_lactico', isDefault: false, label: 'Anaerobico lactico', sortOrder: 100 },
  { code: 'fartlek', isDefault: false, label: 'Fartlek', sortOrder: 110 },
];
