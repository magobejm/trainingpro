export type CatalogEntry = {
  code: string;
  label: string;
  sortOrder: number;
  isDefault?: boolean;
};

export const MOVEMENT_PATTERNS: CatalogEntry[] = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'horizontal_push', label: 'Empuje horizontal', sortOrder: 1 },
  { code: 'vertical_push', label: 'Empuje vertical', sortOrder: 2 },
  { code: 'horizontal_pull', label: 'Tracción horizontal', sortOrder: 3 },
  { code: 'vertical_pull', label: 'Tracción vertical', sortOrder: 4 },
  { code: 'knee_dominant', label: 'Dominante de rodilla', sortOrder: 5 },
  { code: 'hip_hinge', label: 'Bisagra de cadera', sortOrder: 6 },
  { code: 'hip_thrust', label: 'Empuje de cadera', sortOrder: 7 },
  { code: 'rotation_anti', label: 'Rotación/Anti-rotación', sortOrder: 8 },
  { code: 'stabilization', label: 'Estabilización', sortOrder: 9 },
  { code: 'locomotion', label: 'Locomoción y transporte', sortOrder: 10 },
  { code: 'elbow_flexion', label: 'Flexión de codo', sortOrder: 11 },
  { code: 'elbow_extension', label: 'Extensión de codo', sortOrder: 12 },
];

export const MOBILITY_EXTRA_PATTERNS: CatalogEntry[] = [
  { code: 'ankle_flex_ext', label: 'Flexo/Extensión de tobillo', sortOrder: 13 },
  { code: 'hip_abduction', label: 'Abducción de cadera', sortOrder: 14 },
  { code: 'shoulder_abduction', label: 'Abducción de hombro', sortOrder: 15 },
];

export const ANATOMICAL_PLANES: CatalogEntry[] = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'sagittal', label: 'Sagital', sortOrder: 1 },
  { code: 'frontal', label: 'Frontal', sortOrder: 2 },
  { code: 'transverse', label: 'Transversal', sortOrder: 3 },
];

export const MOBILITY_TYPES: CatalogEntry[] = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'rodilla', label: 'Rodilla', sortOrder: 1 },
  { code: 'tobillo', label: 'Tobillo', sortOrder: 2 },
  { code: 'cadera', label: 'Cadera', sortOrder: 3 },
  { code: 'columna', label: 'Columna', sortOrder: 4 },
  { code: 'hombro', label: 'Hombro', sortOrder: 5 },
  { code: 'cuello', label: 'Cuello', sortOrder: 6 },
  { code: 'muneca', label: 'Muñeca', sortOrder: 7 },
  { code: 'codo', label: 'Codo', sortOrder: 8 },
];

export const SPORT_TYPES: CatalogEntry[] = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'halterofilia', label: 'Halterofilia', sortOrder: 1 },
  { code: 'crosstraining', label: 'CrossTraining', sortOrder: 2 },
  { code: 'natacion', label: 'Natación', sortOrder: 3 },
];

export const NEW_EQUIPMENT: CatalogEntry[] = [
  { code: 'foam_roller', label: 'Foam Roller', sortOrder: 17 },
  { code: 'stick', label: 'Palo', sortOrder: 18 },
  { code: 'fins', label: 'Aletas', sortOrder: 19 },
  { code: 'paddles', label: 'Palas', sortOrder: 20 },
  { code: 'pull_buoy', label: 'Pull-buoy', sortOrder: 21 },
  { code: 'kickboard', label: 'Tabla', sortOrder: 22 },
  { code: 'sled', label: 'Trineo', sortOrder: 23 },
];

export const MOBILITY_PATTERN_MAP: Record<string, string> = {
  'dominante de rodilla': 'knee_dominant',
  'flexo/extension de tobillo': 'ankle_flex_ext',
  'estabilizacion': 'stabilization',
  'rotacion/anti-rotacion': 'rotation_anti',
  'abduccion de cadera': 'hip_abduction',
  'abduccion de hombro': 'shoulder_abduction',
  'tracción horizontal': 'horizontal_pull',
  'traccion horizontal': 'horizontal_pull',
  'bisagra de cadera': 'hip_hinge',
  'empuje vertical': 'vertical_push',
  'locomocion y transporte': 'locomotion',
  'locomoción y transporte': 'locomotion',
};

export const MOBILITY_PLANE_MAP: Record<string, string> = {
  'sagital': 'sagittal',
  'frontal': 'frontal',
  'transversal': 'transverse',
};

export const MOBILITY_BODY_PART_MAP: Record<string, string> = {
  'Rodilla': 'rodilla',
  'Tobillo': 'tobillo',
  'Cadera': 'cadera',
  'Cadera, Columna': 'cadera',
  'Columna, Cadera': 'columna',
  'Columna': 'columna',
  'Columna ': 'columna',
  'Hombro': 'hombro',
  'Cuello': 'cuello',
  'Muñeca': 'muneca',
  'Codo': 'codo',
};

export const MOBILITY_EQUIPMENT_MAP: Record<string, string> = {
  'TKE (Terminal Knee Extension)': 'band',
  'Distracción de tobillo con banda': 'band',
  'Flexión plantar/dorsal con banda': 'band',
  'Inversión/Eversión con banda': 'band',
  'Spanish Squat (Isométrico)': 'band',
  'Distracción de cadera con banda': 'band',
  'Band Pull-aparts': 'band',
  'Facepull (Movilidad)': 'band',
  '"No Money" drill': 'band',
  'Poliquin Step-up': 'low_step',
  'Petersen Step-up': 'low_step',
  'Estiramiento excéntrico de gemelo': 'low_step',
  'Extensión torácica (Rodillo)': 'foam_roller',
  'Masaje miofascial (Rodillo)': 'foam_roller',
  'Jefferson Curl': 'kettlebell',
  'Dislocaciones de hombro': 'stick',
  'Cossack Squat asistida': 'stick',
  'Wall Slides': 'wall',
  'Couch Stretch': 'wall',
};

export const SPORT_PATTERN_MAP: Record<string, string> = {
  'dominante de rodilla': 'knee_dominant',
  'bisagra de cadera': 'hip_hinge',
  'empuje vertical': 'vertical_push',
  'tracción vertical': 'vertical_pull',
  'traccion vertical': 'vertical_pull',
  'estabilizacion': 'stabilization',
  'rotacion/anti-rotacion': 'rotation_anti',
  'locomocion y transporte': 'locomotion',
  'locomoción y transporte': 'locomotion',
  'flexo/extension de tobillo': 'ankle_flex_ext',
};

export const SPORT_PLANE_MAP: Record<string, string> = {
  'sagital': 'sagittal',
  'frontal': 'frontal',
  'transversal': 'transverse',
};

export const SPORT_TYPE_MAP: Record<string, string> = {
  'Halterofilia': 'halterofilia',
  'CrossTraining': 'crosstraining',
  'Natación': 'natacion',
};

export const SPORT_EQUIPMENT_MAP: Record<string, string> = {
  'Arrancada (Snatch)': 'barbell',
  'Dos tiempos (Clean & Jerk)': 'barbell',
  'Power Clean': 'barbell',
  'Power Snatch': 'barbell',
  'Hang Clean': 'barbell',
  'Hang Snatch': 'barbell',
  'Overhead Squat': 'barbell',
  'Tirón de arrancada / cargada': 'barbell',
  'Muscle Snatch': 'barbell',
  'Split Jerk': 'barbell',
  'Envión (Jerk)': 'barbell',
  'Thrusters': 'barbell',
  'Cluster': 'barbell',
  'Shoulder to Overhead': 'barbell',
  'Sumo Deadlift High Pull': 'barbell',
  'Bear Complex': 'barbell',
  'American Swing': 'kettlebell',
  'Kettlebell Snatch': 'kettlebell',
  'Devil Press': 'dumbbell',
  'Dumbbell Snatch': 'dumbbell',
  'Dumbbell Box Step-overs': 'dumbbell',
  'Wall Ball Shots': 'medicine_ball',
  'Sled Push (Trineo)': 'sled',
  'Nado con aletas': 'fins',
  'Nado con palas': 'paddles',
  'Nado con pull-buoy': 'pull_buoy',
  'Patada de crol con tabla': 'kickboard',
};
