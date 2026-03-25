export type RoutineObjectiveSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const ROUTINE_OBJECTIVES_V1: RoutineObjectiveSeed[] = [
  {
    code: 'fuerza_maxima',
    isDefault: false,
    label: 'Fuerza máxima',
    sortOrder: 10,
  },
  {
    code: 'hipertrofia',
    isDefault: false,
    label: 'Hipertrofia',
    sortOrder: 20,
  },
  {
    code: 'potencia',
    isDefault: false,
    label: 'Potencia',
    sortOrder: 30,
  },
  {
    code: 'resistencia_muscular',
    isDefault: false,
    label: 'Resistencia muscular',
    sortOrder: 40,
  },
  {
    code: 'readaptacion_lesion',
    isDefault: false,
    label: 'Readaptación a una lesión',
    sortOrder: 50,
  },
  {
    code: 'prevencion_lesiones',
    isDefault: false,
    label: 'Prevención de lesiones',
    sortOrder: 60,
  },
  {
    code: 'movilidad',
    isDefault: false,
    label: 'Movilidad',
    sortOrder: 70,
  },
  {
    code: 'salud_cardiovascular',
    isDefault: false,
    label: 'Salud cardiovascular',
    sortOrder: 80,
  },
  {
    code: 'preparacion_especifica',
    isDefault: false,
    label: 'Preparación específica',
    sortOrder: 90,
  },
  {
    code: 'entrenamiento_cardiovascular',
    isDefault: false,
    label: 'Entrenamiento cardiovascular',
    sortOrder: 100,
  },
];
