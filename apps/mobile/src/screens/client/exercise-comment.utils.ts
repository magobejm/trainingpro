import { type IncidentCategory } from './incident-notice.utils';

export function incidentSeverityForCategory(category: IncidentCategory): 'HIGH' | 'LOW' | 'MEDIUM' {
  if (category === 'lesion') {
    return 'HIGH';
  }
  if (category === 'dolor') {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function formatExerciseCommentChatNotice(input: {
  comment: string;
  date: string;
  exerciseName: string;
  routineDay: string;
}): string {
  return [
    '💬 Comentario sobre el ejercicio:',
    `📅 Fecha: ${input.date}`,
    `🏋️ Día de la rutina: ${input.routineDay}`,
    `🎯 Ejercicio: ${input.exerciseName}`,
    `💬 Comentario: ${input.comment}`,
  ].join('\n');
}

export function formatExerciseIncidentChatNotice(input: {
  category: string;
  date: string;
  description: string;
  exerciseName: string;
  routineDay: string;
}): string {
  return [
    '⚠️ Incidencia reportada:',
    `📅 Fecha: ${input.date}`,
    `🏋️ Día de la rutina: ${input.routineDay}`,
    `🎯 Ejercicio: ${input.exerciseName}`,
    `⚡ Gravedad: ${input.category}`,
    `📝 Incidencia: ${input.description}`,
  ].join('\n');
}

export function formatTodayIncidentDate(now: Date = new Date()): string {
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  return `${day}/${month}/${year}`;
}

/** Reads the exercise name back from a chat notice produced by the formatters above. */
export function extractExerciseName(text: null | string | undefined): string | undefined {
  const match = /🎯 Ejercicio:\s*(.+)/.exec(text ?? '');
  const name = match?.[1]?.trim();
  return name ? name.slice(0, 120) : undefined;
}

type ExerciseCommentProps = {
  exerciseLibraryId?: null | string;
  exerciseName: string;
  routineDayLabel: string;
  sessionId: string;
  sessionItemId?: null | string;
};

export function linkTo(props: ExerciseCommentProps) {
  return { sessionId: props.sessionId, sessionItemId: props.sessionItemId ?? null };
}

export function noteInput(props: ExerciseCommentProps, category: 'EXERCISE' | 'OTHER', text: string) {
  return {
    ...linkTo(props),
    category,
    exerciseLibraryId: props.exerciseLibraryId ?? null,
    exerciseName: props.exerciseName,
    text,
  };
}

export function incidentNotice(props: ExerciseCommentProps, category: string, description: string): string {
  return formatExerciseIncidentChatNotice({
    category,
    date: formatTodayIncidentDate(),
    description,
    exerciseName: props.exerciseName,
    routineDay: props.routineDayLabel,
  });
}

export function commentNotice(props: ExerciseCommentProps, comment: string): string {
  return formatExerciseCommentChatNotice({
    comment,
    date: formatTodayIncidentDate(),
    exerciseName: props.exerciseName,
    routineDay: props.routineDayLabel,
  });
}
