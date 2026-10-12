export type ToastTone = 'error' | 'info' | 'success';

export type ToastItem = { id: number; message: string; tone: ToastTone };

export const TOAST_DURATION_MS = 4000;
export const TOAST_MAX_VISIBLE = 3;

/** Añade un aviso; si hay más de `max`, descarta los más antiguos. */
export function addToast(list: ToastItem[], item: ToastItem, max: number = TOAST_MAX_VISIBLE): ToastItem[] {
  return [...list, item].slice(-max);
}

export function removeToast(list: ToastItem[], id: number): ToastItem[] {
  return list.filter((item) => item.id !== id);
}

/** Los errores se quedan un poco más para dar tiempo a leerlos. */
export function toastDuration(tone: ToastTone): number {
  return tone === 'error' ? TOAST_DURATION_MS * 2 : TOAST_DURATION_MS;
}
