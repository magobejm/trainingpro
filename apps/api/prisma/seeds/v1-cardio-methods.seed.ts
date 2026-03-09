export type CardioMethodSeed = {
  id: string;
  methodTypeCode: string;
  name: string;
};

export const CARDIO_METHODS_V1: CardioMethodSeed[] = [
  {
    id: '1913a679-489f-4fa3-bf5c-44d8f6217ac5',
    methodTypeCode: 'continuo_extensivo',
    name: 'Continuo extensivo',
  },
  {
    id: '8c7ad4b5-b471-4d15-84f3-4730db019cc4',
    methodTypeCode: 'continuo_intensivo',
    name: 'Continuo intensivo',
  },
  { id: '5d07bd5f-8575-4820-b36d-f98ef261f0ce', methodTypeCode: 'hiit_corto', name: 'HIIT' },
  {
    id: '4a97bcf9-98d9-4e88-bd8c-d3e7a03f70d1',
    methodTypeCode: 'tempo_umbral',
    name: 'Tempo / Umbral',
  },
  { id: '33c7b878-63f1-4f10-a1da-5f8e2ec4cb9a', methodTypeCode: 'fartlek', name: 'Fartlek' },
];
