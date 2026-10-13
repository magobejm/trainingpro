import React from 'react';
import {
  Activity,
  AlertCircle,
  Apple,
  BarChart2,
  CalendarDays,
  CheckSquare,
  Columns2,
  Dumbbell,
  History,
  LineChart,
  MessageSquare,
  Smile,
  User,
} from 'lucide-react';

export type SectionId =
  | 'training'
  | 'nutrition'
  | 'tests'
  | 'mood'
  | 'volume'
  | 'progress'
  | 'anthropometrics'
  | 'planning'
  | 'external'
  | 'incidents'
  | 'chat'
  | 'timeline'
  | 'compare';

export type SectionItem = {
  emptyKey: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  badgeColor: string;
  iconColor: string;
  id: SectionId;
  titleKey: string;
};

export const DEFAULT_ORDER: SectionId[] = [
  'training',
  'nutrition',
  'tests',
  'mood',
  'volume',
  'progress',
  'anthropometrics',
  'planning',
  'external',
  'incidents',
  'chat',
  'timeline',
  'compare',
];

export const SECTIONS: SectionItem[] = [
  {
    emptyKey: 'coach.clientProfile.details.trainingPlan.empty',
    icon: (props) => React.createElement(Dumbbell, props),
    badgeColor: 'var(--tp-primarySoft)', // bg-blue-50 equiv
    iconColor: 'var(--tp-primary)', // blue-500
    id: 'training',
    titleKey: 'coach.clientProfile.details.trainingPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.nutritionPlan.empty',
    icon: (props) => React.createElement(Apple, props),
    badgeColor: 'var(--tp-surfaceMuted)', // slate-50 equiv
    iconColor: 'var(--tp-textMuted)', // slate-500
    id: 'nutrition',
    titleKey: 'coach.clientProfile.details.nutritionPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.tests.empty',
    icon: (props) => React.createElement(CheckSquare, props),
    badgeColor: 'var(--tp-successSoft)', // emerald-50
    iconColor: 'var(--tp-success)', // emerald-500
    id: 'tests',
    titleKey: 'coach.clientProfile.details.tests.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.mood.empty',
    icon: (props) => React.createElement(Smile, props),
    badgeColor: 'var(--tp-primarySoft)', // blue-50
    iconColor: 'var(--tp-primary)', // blue-500
    id: 'mood',
    titleKey: 'coach.clientProfile.details.mood.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.weeklyVolume.empty',
    icon: (props) => React.createElement(BarChart2, props),
    badgeColor: 'var(--tp-surfaceMuted)', // slate-50
    iconColor: 'var(--tp-textMuted)', // slate-500
    id: 'volume',
    titleKey: 'coach.clientProfile.details.weeklyVolume.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.progress.empty',
    icon: (props) => React.createElement(LineChart, props),
    badgeColor: 'var(--tp-successSoft)', // emerald-50
    iconColor: 'var(--tp-success)', // emerald-500
    id: 'progress',
    titleKey: 'coach.clientProfile.details.progress.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.anthropometrics.empty',
    icon: (props) => React.createElement(User, props),
    badgeColor: 'var(--tp-chartPurpleSoft)', // indigo-50
    iconColor: 'var(--tp-chartPurple)', // indigo-500
    id: 'anthropometrics',
    titleKey: 'coach.clientProfile.details.anthropometrics.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.planning.empty',
    icon: (props) => React.createElement(CalendarDays, props),
    badgeColor: 'var(--tp-surfaceMuted)', // slate-50 (or orange but using slate to match screenshot)
    iconColor: 'var(--tp-textMuted)', // slate-500
    id: 'planning',
    titleKey: 'coach.clientProfile.details.planning.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.external.empty',
    icon: (props) => React.createElement(Activity, props),
    badgeColor: 'var(--tp-chartPinkSoft)', // rose-50
    iconColor: 'var(--tp-chartPink)', // rose-500
    id: 'external',
    titleKey: 'coach.clientProfile.details.external.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.incidents.empty',
    icon: (props) => React.createElement(AlertCircle, props),
    badgeColor: 'var(--tp-dangerSoft)', // red-50
    iconColor: 'var(--tp-danger)', // red-500
    id: 'incidents',
    titleKey: 'coach.clientProfile.details.incidents.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.chat.empty',
    icon: (props) => React.createElement(MessageSquare, props),
    badgeColor: 'var(--tp-surfaceMuted)', // slate-50
    iconColor: 'var(--tp-textMuted)', // slate-500
    id: 'chat',
    titleKey: 'coach.clientProfile.details.chat.title',
  },
  {
    emptyKey: 'coach.timeline.subtitle',
    icon: (props) => React.createElement(History, props),
    badgeColor: 'var(--tp-primarySoft)',
    iconColor: 'var(--tp-primary)',
    id: 'timeline',
    titleKey: 'coach.timeline.title',
  },
  {
    emptyKey: 'coach.compare.subtitle',
    icon: (props) => React.createElement(Columns2, props),
    badgeColor: 'var(--tp-chartTealSoft)',
    iconColor: 'var(--tp-chartTeal)',
    id: 'compare',
    titleKey: 'coach.compare.title',
  },
];
