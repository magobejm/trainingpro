import React from 'react';
import {
  Apple,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CreditCard,
  Dumbbell,
  FileText,
  Flame,
  GraduationCap,
  MessageSquare,
  ScanSearch,
  TriangleAlert,
  Users,
  Utensils,
} from 'lucide-react';
import { colors } from '@trainerpro/ui';
import type { ShellNavItem } from './usePersistentShellRoute';

export function resolveNavItems(role: 'admin' | 'coach'): ShellNavItem[] {
  return role === 'admin' ? resolveAdminNavItems() : resolveCoachNavItems();
}

function resolveAdminNavItems(): ShellNavItem[] {
  return [
    {
      group: 'admin',
      icon: (p) => <GraduationCap {...p} />,
      id: 'admin.coaches',
      labelKey: 'app.nav.admin.coaches',
    },
    {
      group: 'admin',
      icon: (p) => <CreditCard {...p} />,
      id: 'admin.subscription',
      labelKey: 'app.nav.admin.subscription',
    },
  ];
}

// Los bloques y el orden los define nav-groups.ts; aquí solo cada pantalla: icono, color y nombre.
function resolveCoachNavItems(): ShellNavItem[] {
  return [
    item('coach.clients', 'clients', <Users />, 'rgba(99, 102, 241, 0.1)'),
    item('coach.chat', 'clients', <MessageSquare />, 'rgba(59, 130, 246, 0.1)'),
    item('coach.notes', 'clients', <FileText />, 'rgba(99, 102, 241, 0.1)'),
    item('coach.incidents', 'clients', <TriangleAlert />, 'rgba(239, 68, 68, 0.1)'),
    item('coach.calendar', 'clients', <CalendarDays />, 'rgba(16, 185, 129, 0.1)'),
    item('coach.routine.planner', 'planning', <CalendarRange />, 'rgba(249, 115, 22, 0.1)'),
    item('coach.warmup.planner', 'planning', <Flame />, 'rgba(249, 115, 22, 0.1)'),
    item('coach.nutrition', 'planning', <Utensils />, 'rgba(16, 185, 129, 0.1)'),
    item('coach.library.unified', 'library', <Dumbbell />, 'rgba(37, 99, 235, 0.1)'),
    item('coach.library.foods', 'library', <Apple />, 'rgba(59, 130, 246, 0.1)'),
    item('coach.library.routines', 'library', <BookOpen />, 'rgba(249, 115, 22, 0.1)'),
    item('coach.evaluator', 'tools', <ScanSearch />, 'rgba(59, 130, 246, 0.1)'),
    item('coach.notifications', 'tools', <Bell />, 'rgba(239, 68, 68, 0.1)'),
  ];
}

type CoachRoute = Extract<ShellNavItem['id'], `coach.${string}`>;

function item(
  id: CoachRoute,
  group: ShellNavItem['group'],
  icon: React.ReactElement<{ color?: string; size?: number }>,
  badgeColor: string,
): ShellNavItem {
  return {
    badgeColor,
    group,
    icon: (props) => React.cloneElement(icon, props),
    id,
    labelKey: `app.nav.${id}`,
    menuLabelKey: `app.menu.${id}`,
  };
}

export const NAV_BADGE_COLOR = colors.danger;
