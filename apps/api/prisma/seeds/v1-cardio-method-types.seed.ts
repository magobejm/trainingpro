export type CardioMethodTypeSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const CARDIO_METHOD_TYPES_V1: CardioMethodTypeSeed[] = [
  { code: 'sin_definir', isDefault: true, label: 'Sin definir', sortOrder: 0 },
  { code: 'continuo', isDefault: false, label: 'Continuo', sortOrder: 10 },
  { code: 'intervalos', isDefault: false, label: 'Intervalos', sortOrder: 20 },
  { code: 'mixto', isDefault: false, label: 'Mixto', sortOrder: 30 },
];
