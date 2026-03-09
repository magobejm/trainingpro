import React from 'react';
import {
  Activity,
  AlertCircle,
  Apple,
  BarChart2,
  CalendarDays,
  Dumbbell,
  LineChart,
  MessageSquare,
  Smile,
  User,
} from 'lucide-react';

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
  icon: (props: { color: string; size: number }) => React.ReactNode;
  badgeColor: string;
  iconColor: string;
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

export const SECTIONS: SectionItem[] = [
  {
    emptyKey: 'coach.clientProfile.details.trainingPlan.empty',
    icon: (props) => React.createElement(Dumbbell, props),
    badgeColor: 'rgba(59, 130, 246, 0.1)', // bg-blue-50 equiv
    iconColor: '#3b82f6', // blue-500
    id: 'training',
    titleKey: 'coach.clientProfile.details.trainingPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.nutritionPlan.empty',
    icon: (props) => React.createElement(Apple, props),
    badgeColor: 'rgba(100, 116, 139, 0.1)', // slate-50 equiv
    iconColor: '#64748b', // slate-500
    id: 'nutrition',
    titleKey: 'coach.clientProfile.details.nutritionPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.mood.empty',
    icon: (props) => React.createElement(Smile, props),
    badgeColor: 'rgba(59, 130, 246, 0.1)', // blue-50
    iconColor: '#3b82f6', // blue-500
    id: 'mood',
    titleKey: 'coach.clientProfile.details.mood.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.weeklyVolume.empty',
    icon: (props) => React.createElement(BarChart2, props),
    badgeColor: 'rgba(100, 116, 139, 0.1)', // slate-50
    iconColor: '#64748b', // slate-500
    id: 'volume',
    titleKey: 'coach.clientProfile.details.weeklyVolume.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.progress.empty',
    icon: (props) => React.createElement(LineChart, props),
    badgeColor: 'rgba(16, 185, 129, 0.1)', // emerald-50
    iconColor: '#10b981', // emerald-500
    id: 'progress',
    titleKey: 'coach.clientProfile.details.progress.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.anthropometrics.empty',
    icon: (props) => React.createElement(User, props),
    badgeColor: 'rgba(99, 102, 241, 0.1)', // indigo-50
    iconColor: '#6366f1', // indigo-500
    id: 'anthropometrics',
    titleKey: 'coach.clientProfile.details.anthropometrics.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.planning.empty',
    icon: (props) => React.createElement(CalendarDays, props),
    badgeColor: 'rgba(100, 116, 139, 0.1)', // slate-50 (or orange but using slate to match screenshot)
    iconColor: '#64748b', // slate-500
    id: 'planning',
    titleKey: 'coach.clientProfile.details.planning.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.external.empty',
    icon: (props) => React.createElement(Activity, props),
    badgeColor: 'rgba(244, 63, 94, 0.1)', // rose-50
    iconColor: '#f43f5e', // rose-500
    id: 'external',
    titleKey: 'coach.clientProfile.details.external.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.incidents.empty',
    icon: (props) => React.createElement(AlertCircle, props),
    badgeColor: 'rgba(239, 68, 68, 0.1)', // red-50
    iconColor: '#ef4444', // red-500
    id: 'incidents',
    titleKey: 'coach.clientProfile.details.incidents.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.chat.empty',
    icon: (props) => React.createElement(MessageSquare, props),
    badgeColor: 'rgba(100, 116, 139, 0.1)', // slate-50
    iconColor: '#64748b', // slate-500
    id: 'chat',
    titleKey: 'coach.clientProfile.details.chat.title',
  },
];
