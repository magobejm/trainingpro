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
    code: 'ganancia_masa_muscular',
    isDefault: false,
    label: 'Ganancia de masa muscular',
    sortOrder: 10,
  },
  {
    code: 'perdida_de_grasa',
    isDefault: false,
    label: 'Pérdida de grasa',
    sortOrder: 20,
  },
  {
    code: 'recomposicion_corporal',
    isDefault: false,
    label: 'Recomposición corporal',
    sortOrder: 30,
  },
  {
    code: 'mejora_salud',
    isDefault: false,
    label: 'Mejora de la salud',
    sortOrder: 40,
  },
  {
    code: 'rendimiento_deportivo',
    isDefault: false,
    label: 'Rendimiento deportivo',
    sortOrder: 50,
  },
];
