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
