export type PhysicalTestFieldKey =
  | 'age'
  | 'distance'
  | 'eyesClosed'
  | 'gender'
  | 'hr'
  | 'level'
  | 'palier'
  | 'reps'
  | 'timeMin'
  | 'timeSec'
  | 'weight'
  | 'workload';

const BASE_FIELDS: PhysicalTestFieldKey[] = ['gender', 'age'];

const DISTANCE_TESTS = new Set([
  'Lanzamiento de Balón Medicinal Sentado',
  'Salto Horizontal a Pies Juntos (Broad Jump)',
  'Salto Vertical de Sargent / CMJ',
  'Test de Cooper (12 Minutos)',
  'Test de Rascarse la Espalda (Back Scratch Test)',
  'Test de Sit and Reach',
]);

const REPS_TESTS = new Set([
  'Test de Dominadas Estrictas (Pull-Ups)',
  'Test de Flexiones (Push-Up Test)',
  'Test de Sentarse y Levantarse en 30 s (30-s Chair Stand)',
]);

const TIMED_BALANCE_TESTS = new Set([
  'Test de Apoyo Unipodal (Flamingo / SLS)',
  'Test de Resistencia de Plancha Isométrica (Plank Test)',
]);

/** Cada test pide los mismos datos en la web y en la app. */
export function physicalTestFields(testName: string): PhysicalTestFieldKey[] {
  if (testName === 'Test de Caminata de Rockport (1 milla)') return [...BASE_FIELDS, 'weight', 'timeMin', 'timeSec', 'hr'];
  if (DISTANCE_TESTS.has(testName)) return [...BASE_FIELDS, 'distance'];
  if (REPS_TESTS.has(testName)) return [...BASE_FIELDS, 'reps'];
  if (TIMED_BALANCE_TESTS.has(testName)) return [...BASE_FIELDS, 'timeMin', 'timeSec', 'eyesClosed'];
  if (testName === 'Test del Escalón de 3 Minutos del YMCA') return [...BASE_FIELDS, 'hr'];
  if (testName === 'Test de Course-Navette (20 m Shuttle Run)') return [...BASE_FIELDS, 'palier'];
  if (testName === 'Test Pro Agility 5-10-5 (20-Yard Shuttle)') return [...BASE_FIELDS, 'timeSec', 'level'];
  if (testName === 'Test Submáximo en Cicloergómetro (YMCA)') return [...BASE_FIELDS, 'weight', 'workload'];
  return [...BASE_FIELDS];
}
