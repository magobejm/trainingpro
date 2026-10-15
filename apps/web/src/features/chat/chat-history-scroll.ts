import { compareChatMessages } from '@trainerpro/shared';
type MessageOrder = { id: string; createdAt: string };
export type ChatAnchor = { id: string; offset: number } | null;
export function newChatMessageIds(previous: MessageOrder[], messages: MessageOrder[]): string[] {
  const last = previous[previous.length - 1];
  if (!last) return [];
  const seen = new Set(previous.map((message) => message.id));
  return messages
    .filter((message) => !seen.has(message.id) && compareChatMessages(message, last) > 0)
    .map((message) => message.id);
}
export function captureChatAnchor(viewport: HTMLElement): ChatAnchor {
  const top = viewport.getBoundingClientRect().top;
  const first = [...viewport.querySelectorAll<HTMLElement>('[id^="chat-message-"]')].find(
    (element) => element.getBoundingClientRect().bottom > top,
  );
  return first ? { id: first.id, offset: first.getBoundingClientRect().top - top } : null;
}
export function restoreChatAnchor(viewport: HTMLElement, anchor: ChatAnchor): void {
  if (!anchor) return;
  const element = [...viewport.querySelectorAll<HTMLElement>('[id^="chat-message-"]')].find((item) => item.id === anchor.id);
  if (element)
    viewport.scrollTop += element.getBoundingClientRect().top - viewport.getBoundingClientRect().top - anchor.offset;
}
