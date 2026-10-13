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
    item('coach.clients', 'clients', <Users />, 'var(--tp-chartPurpleSoft)'),
    item('coach.chat', 'clients', <MessageSquare />, 'var(--tp-primarySoft)'),
    item('coach.notes', 'clients', <FileText />, 'var(--tp-chartPurpleSoft)'),
    item('coach.incidents', 'clients', <TriangleAlert />, 'var(--tp-dangerSoft)'),
    item('coach.calendar', 'clients', <CalendarDays />, 'var(--tp-successSoft)'),
    item('coach.routine.planner', 'planning', <CalendarRange />, 'var(--tp-warningSoft)'),
    item('coach.warmup.planner', 'planning', <Flame />, 'var(--tp-warningSoft)'),
    item('coach.nutrition', 'planning', <Utensils />, 'var(--tp-successSoft)'),
    item('coach.library.unified', 'library', <Dumbbell />, 'var(--tp-primarySoft)'),
    item('coach.library.foods', 'library', <Apple />, 'var(--tp-primarySoft)'),
    item('coach.library.routines', 'library', <BookOpen />, 'var(--tp-warningSoft)'),
    item('coach.evaluator', 'tools', <ScanSearch />, 'var(--tp-primarySoft)'),
    item('coach.notifications', 'tools', <Bell />, 'var(--tp-dangerSoft)'),
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
