export type ClientObjectiveSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const CLIENT_OBJECTIVES_V1: ClientObjectiveSeed[] = [
  {
    code: 'sin_objetivo_definido',
    isDefault: true,
    label: 'Sin objetivo definido',
    sortOrder: 0,
  },
  {
    code: 'perdida_de_peso',
    isDefault: false,
    label: 'Perdida de peso',
    sortOrder: 10,
  },
  {
    code: 'ganancia_muscular',
    isDefault: false,
    label: 'Ganancia muscular',
    sortOrder: 20,
  },
  {
    code: 'recomposicion_corporal',
    isDefault: false,
    label: 'Recomposicion corporal',
    sortOrder: 30,
  },
  {
    code: 'mejora_rendimiento',
    isDefault: false,
    label: 'Mejora de rendimiento',
    sortOrder: 40,
  },
  {
    code: 'salud_bienestar',
    isDefault: false,
    label: 'Salud y bienestar',
    sortOrder: 50,
  },
];
