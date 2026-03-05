export type SectionId =
  | 'training'
  | 'nutrition'
  | 'mood'
  | 'volume'
  | 'progress'
  | 'anthropometrics'
  | 'planning'
  | 'external'
  | 'incidents'
  | 'chat';

export type SectionItem = {
  emptyKey: string;
  icon: string;
  id: SectionId;
  titleKey: string;
};

export const DEFAULT_ORDER: SectionId[] = [
  'training',
  'nutrition',
  'mood',
  'volume',
  'progress',
  'anthropometrics',
  'planning',
  'external',
  'incidents',
  'chat',
];

const ICONS: Record<SectionId, string> = {
  anthropometrics: '◯',
  chat: '◧',
  external: '◉',
  incidents: '△',
  mood: '☺',
  nutrition: '◌',
  planning: '▦',
  progress: '↗',
  training: '⌁',
  volume: '▮',
};

export const SECTIONS: SectionItem[] = [
  {
    emptyKey: 'coach.clientProfile.details.trainingPlan.empty',
    icon: ICONS.training,
    id: 'training',
    titleKey: 'coach.clientProfile.details.trainingPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.nutritionPlan.empty',
    icon: ICONS.nutrition,
    id: 'nutrition',
    titleKey: 'coach.clientProfile.details.nutritionPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.mood.empty',
    icon: ICONS.mood,
    id: 'mood',
    titleKey: 'coach.clientProfile.details.mood.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.weeklyVolume.empty',
    icon: ICONS.volume,
    id: 'volume',
    titleKey: 'coach.clientProfile.details.weeklyVolume.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.progress.empty',
    icon: ICONS.progress,
    id: 'progress',
    titleKey: 'coach.clientProfile.details.progress.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.anthropometrics.empty',
    icon: ICONS.anthropometrics,
    id: 'anthropometrics',
    titleKey: 'coach.clientProfile.details.anthropometrics.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.planning.empty',
    icon: ICONS.planning,
    id: 'planning',
    titleKey: 'coach.clientProfile.details.planning.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.external.empty',
    icon: ICONS.external,
    id: 'external',
    titleKey: 'coach.clientProfile.details.external.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.incidents.empty',
    icon: ICONS.incidents,
    id: 'incidents',
    titleKey: 'coach.clientProfile.details.incidents.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.chat.empty',
    icon: ICONS.chat,
    id: 'chat',
    titleKey: 'coach.clientProfile.details.chat.title',
  },
];
