import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react';
import { colors, fontSize, radius, shadow, space } from '@trainerpro/ui';
import type { ShellRoute } from './usePersistentShellRoute';
import { useQuickCreateStore, type QuickCreateIntent } from '../store/quickCreate.store';
import { useRoutinePlannerContextStore } from '../store/routinePlannerContext.store';

const HIDDEN_ON: ShellRoute[] = ['coach.chat', 'coach.routine.planner'];
const BOX_NONE = 'box-none' as const;
const POINTER_AUTO = 'auto' as const;

type Props = {
  compact: boolean;
  onMenuRoute: (route: ShellRoute) => void;
  role: 'admin' | 'coach';
  route: ShellRoute;
  t: (key: string) => string;
};

const OPTIONS: Array<{ intent: QuickCreateIntent | 'routine'; key: string; route: ShellRoute }> = [
  { intent: 'client', key: 'app.quickCreate.client', route: 'coach.clients' },
  { intent: 'note', key: 'app.quickCreate.note', route: 'coach.notes' },
  { intent: 'calendar', key: 'app.quickCreate.calendar', route: 'coach.calendar' },
  { intent: 'routine', key: 'app.quickCreate.routine', route: 'coach.routine.planner' },
];

export function QuickCreateButton(props: Props): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (props.role !== 'coach' || HIDDEN_ON.includes(props.route)) return null;
  return (
    <View pointerEvents={BOX_NONE} style={styles.host}>
      {open ? (
        <Pressable accessibilityLabel={props.t('common.close')} onPress={() => setOpen(false)} style={styles.backdrop} />
      ) : null}
      <View pointerEvents={POINTER_AUTO} style={[styles.stack, props.compact && styles.stackCompact]}>
        {open ? (
          <QuickCreateMenu onPick={(option) => pickOption(option, props.onMenuRoute, () => setOpen(false))} t={props.t} />
        ) : null}
        <Pressable
          accessibilityLabel={props.t('app.quickCreate.open')}
          accessibilityRole="button"
          onPress={() => setOpen((current) => !current)}
          style={styles.fab}
        >
          <Plus color={colors.surface} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

function QuickCreateMenu(props: {
  onPick: (option: (typeof OPTIONS)[number]) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.menu}>
      {OPTIONS.map((option) => (
        <Pressable accessibilityRole="button" key={option.key} onPress={() => props.onPick(option)} style={styles.option}>
          <Text style={styles.optionLabel}>{props.t(option.key)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function pickOption(option: (typeof OPTIONS)[number], onMenuRoute: (route: ShellRoute) => void, close: () => void): void {
  close();
  if (option.intent === 'routine') {
    useRoutinePlannerContextStore.getState().openBlankFromLibrary();
  } else {
    useQuickCreateStore.getState().request(option.intent);
  }
  onMenuRoute(option.route);
}

const styles = StyleSheet.create({
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
    ...shadow.lg,
  },
  host: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20 },
  stack: { alignItems: 'flex-end', bottom: space.xl, position: 'absolute', right: space.xl },
  stackCompact: { bottom: space.xxl },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: space.sm,
    minWidth: 220,
    ...shadow.md,
  },
  option: { paddingHorizontal: space.lg, paddingVertical: space.md },
  optionLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
});
