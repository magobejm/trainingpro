import { useEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';

const FIELD_SELECTOR = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
const FOCUSABLE_SELECTOR = [
  FIELD_SELECTOR,
  'button:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])',
].join(', ');

type Focusable = { focus: () => void };
const dialogStack: symbol[] = [];

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
    const dialogId = Symbol('dialog');
    dialogStack.push(dialogId);
    const active = document.activeElement;
    previousRef.current = active instanceof HTMLElement ? active : null;
    const frame = requestAnimationFrame(() => {
      if (dialogStack[dialogStack.length - 1] !== dialogId) return;
      const root = readHost(containerRef.current);
      if (root) focusFirstField(root);
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== dialogId) return;
      const root = readHost(containerRef.current);
      if (root) keepTabInside(event, root);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      const wasTop = dialogStack[dialogStack.length - 1] === dialogId;
      const index = dialogStack.indexOf(dialogId);
      if (index >= 0) dialogStack.splice(index, 1);
      if (wasTop && previousRef.current?.isConnected) restoreFocus(previousRef.current);
      previousRef.current = null;
    };
  }, [containerRef, visible]);
}

function listFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.closest('[hidden], [inert]') && element.getClientRects().length > 0,
  );
}

function readHost(node: unknown): HTMLElement | null {
  if (typeof HTMLElement === 'undefined') return null;
  return node instanceof HTMLElement ? node : null;
}
