export type ExerciseSeed = {
  id: string;
  muscleGroupCode: string;
  name: string;
};

export const EXERCISES_V1: ExerciseSeed[] = [
  {
    id: '6f51f28e-274e-4f6f-9b8a-4ca1f38e9121',
    muscleGroupCode: 'pecho',
    name: 'Press banca plano',
  },
  { id: '3b6ceb27-1707-42b4-a980-ea93f4f31779', muscleGroupCode: 'espalda', name: 'Dominadas' },
  {
    id: 'be5e4f0f-1860-43ed-b5ad-8a89f938ed68',
    muscleGroupCode: 'pierna',
    name: 'Sentadilla trasera',
  },
  {
    id: '09d3ef95-5872-4e4e-9f16-dc9d72d5868b',
    muscleGroupCode: 'hombro',
    name: 'Press militar',
  },
  { id: '5f734175-76c4-44d7-a8ec-6d1a6322d68a', muscleGroupCode: 'core', name: 'Plancha frontal' },
  {
    id: 'f39e7ea6-c5f9-4566-b700-b10f0f2cb07f',
    muscleGroupCode: 'brazo',
    name: 'Curl de biceps barra',
  },
];
