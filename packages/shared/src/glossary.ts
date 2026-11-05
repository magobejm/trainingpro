import type { ExerciseBlockType, SetVariableKey } from './exercise-set-variables';

export type GlossaryLocale = 'en' | 'es';

export type GlossaryEntry = {
  body: string;
  id: string;
  short: string;
  term: string;
  types?: ExerciseBlockType[];
};

export type GlossaryGroup = {
  entries: GlossaryEntry[];
  id: 'progress' | 'sets';
  title: string;
};

type Copy = { body: string; short: string; term: string };

const TYPE_NAME: Record<GlossaryLocale, Record<ExerciseBlockType, string>> = {
  en: {
    cardio: 'cardio',
    isometric: 'isometric',
    mobility: 'mobility',
    plio: 'plyometrics',
    sport: 'sport',
    strength: 'strength',
  },
  es: {
    cardio: 'cardio',
    isometric: 'isométrico',
    mobility: 'movilidad',
    plio: 'pliometría',
    sport: 'deporte',
    strength: 'fuerza',
  },
};

const SET_TYPES: Record<SetVariableKey, ExerciseBlockType[]> = {
  distanceMeters: ['cardio', 'sport'],
  durationSeconds: ['cardio', 'isometric', 'plio', 'sport'],
  fcMaxPct: ['cardio', 'sport'],
  fcReservePct: ['cardio', 'sport'],
  heartRate: ['cardio', 'sport'],
  reps: ['strength', 'plio', 'mobility', 'sport'],
  restSeconds: ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'],
  rir: ['strength', 'sport'],
  rom: ['mobility', 'sport'],
  rpe: ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'],
  weightKg: ['strength', 'isometric', 'plio', 'mobility', 'sport'],
};

const SET_COPY: Record<GlossaryLocale, Record<SetVariableKey | 'set', Copy>> = {
  en: {
    distanceMeters: {
      body: 'One kilometer on screen is 1000 stored meters.',
      short: 'Distance of the set, shown in kilometers.',
      term: 'Distance',
    },
    durationSeconds: {
      body: 'Stored in seconds and shown in seconds, minutes or hours.',
      short: 'Work time of the set or interval.',
      term: 'Duration',
    },
    fcMaxPct: {
      body: 'You can enter one value or a range. 100% is your maximum heart rate.',
      short: 'Percent of your maximum heart rate.',
      term: '% HR max',
    },
    fcReservePct: {
      body: 'You can enter one value or a range. It is not the same percentage as max heart rate.',
      short: 'Percent of heart-rate reserve, maximum minus resting.',
      term: '% HR reserve',
    },
    heartRate: {
      body: 'You can enter one value or a range.',
      short: 'Heart rate of the set, in beats per minute.',
      term: 'Heart rate',
    },
    reps: {
      body: 'Counts each complete repetition of that set. It is not the number of sets.',
      short: 'How many times you perform the movement in the set.',
      term: 'Reps',
    },
    restSeconds: {
      body: 'Shown in seconds, or in minutes and hours when the pause is long.',
      short: 'Pause before the next set.',
      term: 'Rest',
    },
    rir: {
      body: 'When it is missing, the estimated 1RM uses 10 minus the set RPE.',
      short: 'Repetitions you could still do before failing.',
      term: 'RIR',
    },
    rom: {
      body: 'Full uses the whole range, partial shortens it and minimal stays in the short part.',
      short: 'Joint range of the set: full, partial or minimal.',
      term: 'ROM',
    },
    rpe: {
      body: '10 is the most you could do in that set. It is not the session RPE.',
      short: 'How hard that set felt, from 0 to 10.',
      term: 'RPE',
    },
    set: {
      body: 'An exercise can have several sets in a row, separated by the rest.',
      short: 'One bout of the exercise, with its reps or its time.',
      term: 'Set',
    },
    weightKg: {
      body: 'The weight moved in that set. It can stay empty when the exercise has no load.',
      short: 'External load of the set, in kilograms.',
      term: 'Weight',
    },
  },
  es: {
    distanceMeters: {
      body: 'Un kilómetro en pantalla equivale a 1000 metros guardados.',
      short: 'Recorrido de la serie, mostrado en kilómetros.',
      term: 'Distancia',
    },
    durationSeconds: {
      body: 'Se guarda en segundos y se muestra en segundos, minutos u horas.',
      short: 'Tiempo de trabajo de la serie o del intervalo.',
      term: 'Duración',
    },
    fcMaxPct: {
      body: 'Puede anotarse como un valor o como un rango. El 100 % es tu frecuencia máxima.',
      short: 'Porcentaje de tu frecuencia cardíaca máxima.',
      term: '% FC máx',
    },
    fcReservePct: {
      body: 'Puede anotarse como un valor o como un rango. No es el mismo porcentaje que la FC máxima.',
      short: 'Porcentaje de la reserva cardíaca, la máxima menos la de reposo.',
      term: '% FC reserva',
    },
    heartRate: {
      body: 'Puede anotarse como un valor o como un rango.',
      short: 'Frecuencia cardíaca de la serie, en pulsaciones por minuto.',
      term: 'Pulsaciones',
    },
    reps: {
      body: 'Cuenta cada repetición completa de esa serie. No es el número de series.',
      short: 'Veces que se hace el movimiento en la serie.',
      term: 'Repeticiones',
    },
    restSeconds: {
      body: 'Se muestra en segundos, o en minutos y horas cuando la pausa es larga.',
      short: 'Pausa entre esta serie y la siguiente.',
      term: 'Descanso',
    },
    rir: {
      body: 'Si no se anota, el 1RM estimado usa 10 menos el RPE de la serie.',
      short: 'Repeticiones que te quedarían antes de no poder hacer otra.',
      term: 'RIR',
    },
    rom: {
      body: 'Completo usa todo el recorrido, parcial lo acorta y mínimo se queda en el tramo corto.',
      short: 'Recorrido articular de la serie: completo, parcial o mínimo.',
      term: 'ROM',
    },
    rpe: {
      body: 'El 10 es el máximo que podrías hacer en esa serie. No es el RPE de toda la sesión.',
      short: 'Esfuerzo percibido de la serie, de 0 a 10.',
      term: 'RPE',
    },
    set: {
      body: 'Un ejercicio puede tener varias series seguidas, separadas por el descanso.',
      short: 'Una tanda del ejercicio, con sus repeticiones o su tiempo.',
      term: 'Serie',
    },
    weightKg: {
      body: 'Es el peso que se mueve en esa serie. Si el ejercicio no lleva carga, puede quedar vacío.',
      short: 'Carga externa de la serie, en kilogramos.',
      term: 'Peso',
    },
  },
};

const PROGRESS_IDS = [
  'tonnage',
  'totalReps',
  'e1rm',
  'inol',
  'trainingLoad',
  'adherence',
  'microcycle',
  'sessionRpe',
] as const;

const PROGRESS_COPY: Record<GlossaryLocale, Record<(typeof PROGRESS_IDS)[number], Copy>> = {
  en: {
    adherence: {
      body: 'Only sessions planned through today count. A logged session can still feed the charts when adherence stays at zero because nothing was planned.',
      short: 'Sessions completed against those planned up to today.',
      term: 'Adherence',
    },
    e1rm: {
      body: 'Brzycki: weight divided by 1.0278 minus 0.0278 times the reps to failure. Those reps are the ones performed plus RIR, or 10 minus RPE when RIR is missing.',
      short: 'Theoretical heaviest weight for a single repetition.',
      term: 'Estimated 1RM',
    },
    inol: {
      body: 'Each set is the repetitions divided by 100 minus the weight as a percent of the estimated 1RM.',
      short: 'Intensity and volume index of the loaded sets.',
      term: 'INOL',
    },
    microcycle: {
      body: 'Comparing several microcycles draws one point per block. Choosing a single one switches the points to sessions.',
      short: 'A block of the routine. A 7-day block is labeled as a week.',
      term: 'Microcycle',
    },
    sessionRpe: {
      body: 'It is asked when the day is finished. Routine training load uses this value, not each set RPE.',
      short: 'Effort of the whole session, not of one set.',
      term: 'Session RPE',
    },
    tonnage: {
      body: 'Each set adds kilograms times repetitions. The routine chart adds the sessions inside it.',
      short: 'Sum of weight times the repetitions performed.',
      term: 'Tonnage',
    },
    totalReps: {
      body: 'It counts repetitions and does not multiply by weight.',
      short: 'Sum of the repetitions performed.',
      term: 'Repetition volume',
    },
    trainingLoad: {
      body: 'On routine progress, a session load is its duration in minutes times the session RPE. A microcycle adds the sessions inside it.',
      short: 'Session minutes multiplied by its RPE.',
      term: 'Training load',
    },
  },
  es: {
    adherence: {
      body: 'Solo cuenta lo planificado hasta el día de hoy. Una sesión registrada puede alimentar las gráficas aunque la adherencia siga en cero si no había sesiones planificadas.',
      short: 'Sesiones hechas respecto a las planificadas hasta hoy.',
      term: 'Adherencia',
    },
    e1rm: {
      body: 'Sale de Brzycki: peso dividido entre 1,0278 menos 0,0278 por las repeticiones hasta el fallo. Esas repeticiones son las hechas más el RIR, o 10 menos el RPE si no hay RIR.',
      short: 'Peso máximo teórico de una sola repetición.',
      term: '1RM estimado',
    },
    inol: {
      body: 'Cada serie vale las repeticiones divididas entre 100 menos el porcentaje del peso respecto al 1RM estimado.',
      short: 'Índice de intensidad y volumen de las series con peso.',
      term: 'INOL',
    },
    microcycle: {
      body: 'Al comparar varios microciclos hay un punto por bloque. Si eliges uno solo, los puntos pasan a ser las sesiones.',
      short: 'Bloque de la rutina. Si dura 7 días, la gráfica lo llama semana.',
      term: 'Microciclo',
    },
    sessionRpe: {
      body: 'Se pide al terminar el día. La carga de entrenamiento de la rutina usa este valor, no el RPE de cada serie.',
      short: 'Esfuerzo de toda la sesión, no de una serie.',
      term: 'RPE de sesión',
    },
    tonnage: {
      body: 'Cada serie suma kilogramos por repeticiones. La gráfica de la rutina junta el de sus sesiones.',
      short: 'Suma del peso por las repeticiones hechas.',
      term: 'Tonelaje',
    },
    totalReps: {
      body: 'Cuenta repeticiones, sin multiplicar por el peso.',
      short: 'Suma de las repeticiones hechas.',
      term: 'Volumen de repeticiones',
    },
    trainingLoad: {
      body: 'En el progreso de la rutina, la carga de una sesión es su duración en minutos por el RPE de la sesión. El microciclo suma las sesiones que entran en él.',
      short: 'Minutos de la sesión multiplicados por su RPE.',
      term: 'Carga de entrenamiento',
    },
  },
};

const GROUP_TITLE: Record<GlossaryLocale, Record<GlossaryGroup['id'], string>> = {
  en: { progress: 'Progress', sets: 'Set parameters' },
  es: { progress: 'Progreso', sets: 'Parámetros de la serie' },
};

const INTRO: Record<GlossaryLocale, string> = {
  en: 'What each exercise parameter and progress metric means.',
  es: 'Qué significa cada parámetro del ejercicio y cada métrica de progreso.',
};

const SET_ORDER: SetVariableKey[] = [
  'reps',
  'weightKg',
  'rpe',
  'rir',
  'restSeconds',
  'durationSeconds',
  'distanceMeters',
  'fcMaxPct',
  'fcReservePct',
  'heartRate',
  'rom',
];

export function glossaryLocale(language: string): GlossaryLocale {
  return language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function glossary(locale: GlossaryLocale): { groups: GlossaryGroup[]; intro: string } {
  return { groups: [setGroup(locale), progressGroup(locale)], intro: INTRO[locale] };
}

export function glossaryEntry(locale: GlossaryLocale, id: string): GlossaryEntry | undefined {
  return glossary(locale)
    .groups.flatMap((group) => group.entries)
    .find((entry) => entry.id === id);
}

function setGroup(locale: GlossaryLocale): GlossaryGroup {
  const set = withUsage(locale, { ...SET_COPY[locale].set, id: 'set' });
  const variables = SET_ORDER.map((id) => withUsage(locale, { ...SET_COPY[locale][id], id, types: SET_TYPES[id] }));
  return { entries: [set, ...variables], id: 'sets', title: GROUP_TITLE[locale].sets };
}

function progressGroup(locale: GlossaryLocale): GlossaryGroup {
  return {
    entries: PROGRESS_IDS.map((id) => ({ ...PROGRESS_COPY[locale][id], id })),
    id: 'progress',
    title: GROUP_TITLE[locale].progress,
  };
}

function withUsage(locale: GlossaryLocale, entry: GlossaryEntry): GlossaryEntry {
  if (!entry.types?.length) return entry;
  const names = entry.types.map((type) => TYPE_NAME[locale][type]).join(', ');
  const usage = locale === 'es' ? `Se usa en ${names}.` : `Used for ${names}.`;
  return { ...entry, body: `${entry.body} ${usage}` };
}

export function glossaryCoversSetVariables(locale: GlossaryLocale, type: ExerciseBlockType): string[] {
  const entries = glossary(locale).groups.find((group) => group.id === 'sets')?.entries ?? [];
  return entries.filter((entry) => entry.types?.includes(type)).map((entry) => entry.id);
}
