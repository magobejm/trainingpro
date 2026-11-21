import { useTranslation } from 'react-i18next';

const copy = {
  'triage.title': ['Hoy', 'Today'],
  'triage.subtitle': ['Lo que necesita tu atención hoy', 'What needs your attention today'],
  'triage.pending': ['{count} pendientes', '{count} pending'],
  'triage.empty': ['Nada pendiente', 'Nothing pending'],
  'triage.error': ['No se ha podido cargar el triaje', 'Could not load triage'],
  'triage.folded': ['Plegada. No cuenta en el total.', 'Folded. Not counted in the total.'],
  'triage.fold': ['Plegar', 'Fold'],
  'triage.show': ['Mostrar', 'Show'],
  'triage.more': ['Ver {count} más', 'Show {count} more'],
  'triage.less': ['Ver menos', 'Show less'],
  'triage.tab.chat': ['Chat / Incidencias', 'Chat / Incidents'],
  'triage.tab.motivation': ['Motivación / Adherencia', 'Motivation / Adherence'],
  'triage.tab.plan': ['Rutina / Nutrición', 'Routine / Nutrition'],
  'triage.chat': ['Chat sin leer', 'Unread chat'],
  'triage.chatHint': ['Ordenado por el mensaje sin leer más antiguo', 'Sorted by the oldest unread message'],
  'triage.moodHint': ['Check-in de hoy con alguna nota por debajo de 3', 'Today’s check-in with a score under 3'],
  'triage.adherenceHint': [
    'Semana actual por debajo del {percent} % o {days} días o más sin un entreno hecho',
    'This week under {percent}% or {days} days or more without a completed workout',
  ],
  'triage.routinesHint': [
    'Sin rutina, sin calendario o a 14 días o menos del último entreno del calendario',
    'No routine, no calendar, or 14 days or less from the last scheduled workout',
  ],
  'triage.nutritionHint': ['Clientes sin plan de nutrición', 'Clients without a nutrition plan'],
  'triage.chatSince': ['desde {date}', 'since {date}'],
  'triage.incidents': ['Incidencias abiertas', 'Open incidents'],
  'triage.calls': ['Llamadas de hoy', 'Today’s calls'],
  'triage.mood': ['Ánimo y check-ins', 'Mood and check-ins'],
  'triage.adherence': ['Adherencia', 'Adherence'],
  'triage.adherenceValue': ['Adherencia {value} %', 'Adherence {value} %'],
  'triage.noWorkout': ['{days} días sin entrenar', '{days} days without training'],
  'triage.reports': ['Informes sin revisar', 'Unreviewed reports'],
  'triage.wearables': ['Sueño o VFC bajos', 'Low sleep or HRV'],
  'triage.sleep': ['Sueño {hours} h', 'Sleep {hours} h'],
  'triage.hrv': ['VFC {value} ms', 'HRV {value} ms'],
  'triage.routines': ['Rutinas', 'Routines'],
  'triage.noRoutine': ['Sin rutina', 'No routine'],
  'triage.noCalendar': ['Sin calendario', 'No calendar'],
  'triage.daysLeft': ['Quedan {count} días', '{count} days left'],
  'triage.nutrition': ['Plan nutricional', 'Nutrition plan'],
  'triage.noNutrition': ['Sin plan', 'No plan'],
  'triage.field.sleep': ['Sueño', 'Sleep'],
  'triage.field.motivation': ['Motivación', 'Motivation'],
  'triage.field.recovery': ['Recuperación', 'Recovery'],
  'triage.field.pain': ['Dolor', 'Pain'],
  'timeline.filter.all': ['Todo', 'All'],
  'timeline.filter.session': ['Sesiones', 'Sessions'],
  'timeline.filter.chat': ['Chat', 'Chat'],
  'timeline.filter.note': ['Notas', 'Notes'],
  'timeline.filter.incident': ['Incidencias', 'Incidents'],
  'timeline.filter.test': ['Tests', 'Tests'],
  'timeline.filter.photo': ['Fotos', 'Photos'],
  'timeline.filter.nutrition': ['Nutrición', 'Nutrition'],
  'timeline.title': ['Línea de tiempo', 'Timeline'],
  'timeline.empty': ['Todavía no hay actividad que mostrar.', 'No activity to show yet.'],
  'timeline.more': ['Cargar más', 'Load more'],
  'timeline.messages': ['{count} mensajes', '{count} messages'],
  'timeline.today': ['Hoy', 'Today'],
  'timeline.yesterday': ['Ayer', 'Yesterday'],
  'timeline.kind.session': ['Sesión', 'Session'],
  'timeline.kind.note': ['Nota', 'Note'],
  'timeline.kind.chat': ['Chat', 'Chat'],
  'timeline.kind.incident': ['Incidencia', 'Incident'],
  'timeline.kind.test': ['Test', 'Test'],
  'timeline.kind.photo': ['Foto', 'Photo'],
  'timeline.kind.nutrition': ['Nutrición', 'Nutrition'],
  'timeline.reviewed': ['Incidencia revisada', 'Incident reviewed'],
  'timeline.origin': ['Era del {date}', 'Was on {date}'],
  'timeline.reason': ['Motivo: {reason}', 'Reason: {reason}'],
  'routineHistory.title': ['Historial de rutinas', 'Routine history'],
  'routineHistory.current': ['Vigente', 'Current'],
  'routineHistory.initial': [
    'Referencia inicial: contenido disponible al activar el historial.',
    'Initial reference: content available when history was enabled.',
  ],
  'routineHistory.empty': ['Todavía no hay asignaciones guardadas.', 'No saved assignments yet.'],
  'routineHistory.more': ['Cargar anteriores', 'Load earlier'],
  unread: ['Sin leer', 'Unread'],
} as const;

export type ReadonlyCopyKey = keyof typeof copy;

export function useReadonlyCopy() {
  const { i18n } = useTranslation();
  const index = i18n.language.startsWith('en') ? 1 : 0;
  return (key: ReadonlyCopyKey, vars?: Record<string, string | number>): string => {
    const text: string = copy[key][index];
    return vars ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? '')) : text;
  };
}
