import { useEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';

const FIELD_SELECTOR = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
const FOCUSABLE_SELECTOR = [
  FIELD_SELECTOR,
  'button:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  'a[href]',
].join(', ');

type Focusable = { focus: () => void };

export function restoreFocus(previous: Focusable | null): void {
  previous?.focus();
}

export function nextFocusable<T>(items: T[], active: T | null, shiftKey: boolean): T | null {
  const count = items.length;
  if (count === 0) return null;
  const index = active == null ? -1 : items.indexOf(active);
  const wrapped = shiftKey ? index <= 0 : index < 0 || index >= count - 1;
  const nextIndex = wrapped ? (shiftKey ? count - 1 : 0) : index + (shiftKey ? -1 : 1);
  return items[nextIndex] ?? null;
}

export function focusFirstField(root: HTMLElement): void {
  const field = root.querySelector<HTMLElement>(FIELD_SELECTOR);
  const target = field ?? listFocusable(root)[0] ?? root;
  target.focus();
}

export function keepTabInside(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const items = listFocusable(root);
  if (items.length === 0) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const current = active && items.includes(active) ? active : null;
  const atEdge = !current || (event.shiftKey ? current === items[0] : current === items[items.length - 1]);
  if (!atEdge) return;
  event.preventDefault();
  nextFocusable(items, current, event.shiftKey)?.focus();
}

export function useDialogFocus(visible: boolean, containerRef: RefObject<View | null>): void {
  const previousRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!visible || typeof document === 'undefined') return undefined;
    const active = document.activeElement;
    previousRef.current = active instanceof HTMLElement ? active : null;
    const frame = requestAnimationFrame(() => {
      const root = readHost(containerRef.current);
      if (root) focusFirstField(root);
    });
    const onKeyDown = (event: KeyboardEvent) => {
      const root = readHost(containerRef.current);
      if (root) keepTabInside(event, root);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      restoreFocus(previousRef.current);
      previousRef.current = null;
    };
  }, [containerRef, visible]);
}

function listFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

function readHost(node: unknown): HTMLElement | null {
  if (typeof HTMLElement === 'undefined') return null;
  return node instanceof HTMLElement ? node : null;
}
