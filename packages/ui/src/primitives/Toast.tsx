import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow, space } from '../theme/tokens';
import {
  addToast,
  removeToast,
  resolveToastDuration,
  shouldFireExpire,
  type ToastItem,
  type ToastOptions,
  type ToastTone,
} from './toast.logic';

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
  show: (message: string, tone?: ToastTone, options?: ToastOptions) => number;
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
  const controller = useToastController();
  return (
    <ToastContext.Provider value={controller.api}>
      {props.children}
      <View pointerEvents="box-none" style={styles.viewport}>
        {controller.items.map((item) => (
          <ToastCard
            dismissLabel={props.dismissLabel}
            item={item}
            key={item.id}
            onAction={() => controller.dismiss(item.id, true)}
            onDismiss={() => controller.dismiss(item.id, false)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function useToastController() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const expires = useRef<Record<number, (() => void) | undefined>>({});
  const dismiss = useCallback((id: number, fromAction: boolean) => {
    const timer = timers.current[id];
    if (timer) clearTimeout(timer);
    delete timers.current[id];
    const expire = expires.current[id];
    delete expires.current[id];
    setItems((current) => removeToast(current, id));
    if (shouldFireExpire(fromAction)) expire?.();
  }, []);
  const show = useCallback(
    (message: string, tone: ToastTone = 'success', options?: ToastOptions) => {
      const id = nextId.current++;
      expires.current[id] = options?.onExpire;
      setItems((current) => addToast(current, { action: options?.action, id, message, tone }));
      timers.current[id] = setTimeout(() => dismiss(id, false), resolveToastDuration(tone, options?.durationMs));
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
      dismiss: (id) => dismiss(id, false),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
      show,
      success: (message) => show(message, 'success'),
    }),
    [dismiss, show],
  );
  return { api, dismiss, items };
}

/** Devuelve las funciones para mostrar avisos; sin ToastProvider no hace nada. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

function ToastCard(props: {
  dismissLabel: string;
  item: ToastItem;
  onAction: () => void;
  onDismiss: () => void;
}): React.JSX.Element {
  const { item } = props;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={item.tone === 'error' ? 'alert' : undefined}
      style={[styles.toast, { backgroundColor: BACKGROUNDS[item.tone], borderColor: ACCENTS[item.tone] }]}
    >
      <Text style={[styles.icon, { color: ACCENTS[item.tone] }]}>{ICONS[item.tone]}</Text>
      <Text style={styles.message}>{item.message}</Text>
      {item.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            item.action?.onPress();
            props.onAction();
          }}
        >
          <Text style={styles.action}>{item.action.label}</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityLabel={props.dismissLabel} accessibilityRole="button" onPress={props.onDismiss}>
        <Text style={styles.dismiss}>{ICONS.error}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
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
