import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { FlatList, View, ViewToken } from 'react-native';
import type { ChatMessage } from '../../data/hooks/useChat';
import { anchorHasSettled, restoredAnchorOffset } from './chat-history-list-state';

type Anchor = { id: string; y: number; oldestId: string | undefined };
export function useChatListAnchor(list: React.RefObject<FlatList<ChatMessage> | null>) {
  const rows = useRef(new Map<string, View>());
  const firstVisible = useRef<string | undefined>(undefined);
  const anchor = useRef<Anchor | undefined>(undefined);
  const offset = useRef(0);
  const pending = useRef(false);
  const restoring = useRef<Anchor | undefined>(undefined);
  const webNode = () => (Platform.OS === 'web' ? (list.current?.getScrollableNode() as HTMLElement | undefined) : undefined);
  useEffect(() => {
    const node = webNode();
    if (!node) return;
    const previous = node.style.overflowAnchor;
    node.style.overflowAnchor = 'none';
    return () => {
      node.style.overflowAnchor = previous;
    };
  }, []);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<ChatMessage>[] }) => {
    firstVisible.current = viewableItems.find((item) => item.isViewable)?.item.id;
  }).current;
  const capture = (oldestId: string | undefined): Promise<void> =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        const node = webNode();
        if (node) {
          anchor.current = captureWebAnchor(node, oldestId);
          pending.current = Boolean(anchor.current);
          resolve();
          return;
        }
        const id = firstVisible.current;
        const row = id ? rows.current.get(id) : undefined;
        if (!id || !row) {
          resolve();
          return;
        }
        pending.current = true;
        row.measureInWindow((_x, y) => {
          anchor.current = { id, y, oldestId };
          resolve();
        });
      });
    });
  const restore = (oldestId: string | undefined) => {
    const saved = anchor.current;
    if (!saved || saved.oldestId === oldestId) return;
    requestAnimationFrame(() => {
      if (anchor.current !== saved) return;
      const node = webNode();
      if (node) {
        if (restoring.current === saved) return;
        restoring.current = saved;
        stabilizeWebAnchor(
          node,
          saved,
          () => anchor.current === saved,
          () => {
            anchor.current = undefined;
            restoring.current = undefined;
            pending.current = false;
          },
        );
        return;
      }
      const row = rows.current.get(saved.id);
      if (!row) return;
      row.measureInWindow((_x, y) => {
        if (anchor.current !== saved) return;
        anchor.current = undefined;
        const nextOffset = restoredAnchorOffset(offset.current, saved.y, y);
        if (Math.abs(nextOffset - offset.current) > 1) {
          list.current?.scrollToOffset({ offset: nextOffset, animated: false });
        }
        requestAnimationFrame(() => {
          pending.current = false;
        });
      });
    });
  };
  const cancel = () => {
    anchor.current = undefined;
    restoring.current = undefined;
    pending.current = false;
  };
  return { capture, restore, offset, rows, onViewableItemsChanged, pending, cancel };
}

function captureWebAnchor(node: HTMLElement, oldestId: string | undefined): Anchor | undefined {
  const viewport = node.getBoundingClientRect();
  const row = [...node.querySelectorAll<HTMLElement>('[id^="chat-message-"]')].find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > viewport.top && rect.top < viewport.bottom;
  });
  return row ? { id: row.id, y: row.getBoundingClientRect().top, oldestId } : undefined;
}
function restoreWebAnchor(node: HTMLElement, saved: Anchor): number | undefined {
  const row = [...node.querySelectorAll<HTMLElement>('[id^="chat-message-"]')].find((element) => element.id === saved.id);
  if (!row) return undefined;
  const delta = row.getBoundingClientRect().top - saved.y;
  if (Math.abs(delta) > 1) node.scrollTop += delta;
  return delta;
}

function stabilizeWebAnchor(node: HTMLElement, saved: Anchor, current: () => boolean, done: () => void): void {
  const start = Date.now();
  let stableFrames = 0;
  const step = () => {
    if (!current()) return;
    const delta = restoreWebAnchor(node, saved);
    stableFrames = delta !== undefined && Math.abs(delta) <= 1 ? stableFrames + 1 : 0;
    if (anchorHasSettled(stableFrames, Date.now() - start)) done();
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
