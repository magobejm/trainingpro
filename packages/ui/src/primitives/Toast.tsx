import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow, space } from '../theme/tokens';
import { addToast, removeToast, toastDuration, type ToastItem, type ToastTone } from './toast.logic';

const ICONS: Record<ToastTone, string> = { error: '✕', info: 'i', success: '✓' };
const ACCENTS: Record<ToastTone, string> = { error: colors.danger, info: colors.info, success: colors.success };
const BACKGROUNDS: Record<ToastTone, string> = {
  error: colors.dangerSoft,
  info: colors.infoSoft,
  success: colors.successSoft,
};

export type ToastApi = {
  dismiss: (id: number) => void;
  error: (message: string) => number;
  info: (message: string) => number;
  show: (message: string, tone?: ToastTone) => number;
  success: (message: string) => number;
};

const NOOP_API: ToastApi = {
  dismiss: () => undefined,
  error: () => 0,
  info: () => 0,
  show: () => 0,
  success: () => 0,
};

const ToastContext = createContext<ToastApi>(NOOP_API);

export function ToastProvider(props: { children: React.ReactNode; dismissLabel: string }): React.JSX.Element {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const dismiss = useCallback((id: number) => {
    const timer = timers.current[id];
    if (timer) clearTimeout(timer);
    delete timers.current[id];
    setItems((current) => removeToast(current, id));
  }, []);
  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setItems((current) => addToast(current, { id, message, tone }));
      timers.current[id] = setTimeout(() => dismiss(id), toastDuration(tone));
      return id;
    },
    [dismiss],
  );
  useEffect(() => {
    const active = timers.current;
    return () => Object.values(active).forEach((timer) => clearTimeout(timer));
  }, []);
  const api = useMemo<ToastApi>(
    () => ({
      dismiss,
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
      show,
      success: (message) => show(message, 'success'),
    }),
    [dismiss, show],
  );
  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <View pointerEvents="box-none" style={styles.viewport}>
        {items.map((item) => (
          <ToastCard dismissLabel={props.dismissLabel} item={item} key={item.id} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/** Devuelve las funciones para mostrar avisos; sin ToastProvider no hace nada. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

function ToastCard(props: { dismissLabel: string; item: ToastItem; onDismiss: (id: number) => void }): React.JSX.Element {
  const { item } = props;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={item.tone === 'error' ? 'alert' : undefined}
      style={[styles.toast, { backgroundColor: BACKGROUNDS[item.tone], borderColor: ACCENTS[item.tone] }]}
    >
      <Text style={[styles.icon, { color: ACCENTS[item.tone] }]}>{ICONS[item.tone]}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Pressable accessibilityLabel={props.dismissLabel} accessibilityRole="button" onPress={() => props.onDismiss(item.id)}>
        <Text style={styles.dismiss}>{ICONS.error}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dismiss: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: space.xs,
  },
  icon: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  message: {
    color: colors.text,
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  toast: {
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.md,
    maxWidth: 380,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    ...shadow.md,
  },
  viewport: {
    alignItems: 'flex-end',
    gap: space.sm,
    position: 'absolute',
    right: space.lg,
    top: space.lg,
    zIndex: 10000,
  },
});
