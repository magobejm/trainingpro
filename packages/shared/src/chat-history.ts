import type { ChatMessage, ChatCallProposal } from './http/chat';
export const CHAT_HISTORY_PAGE_SIZE = 50;
export type ChatHistory = {
  source: 'cache' | 'recent' | 'older';
  initialized: boolean;
  messages: ChatMessage[];
  hasOlder: boolean;
  oldestId?: string;
};
export function emptyChatHistory(): ChatHistory {
  return { source: 'cache', initialized: false, messages: [], hasOlder: false };
}
export function compareChatMessages(
  a: Pick<ChatMessage, 'createdAt' | 'id'>,
  b: Pick<ChatMessage, 'createdAt' | 'id'>,
): number {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    const previous = byId.get(message.id);
    const oldCall = previous?.callProposal;
    const newCall = message.callProposal;
    const rank = { pending: 0, accepted: 1, cancelled: 2 };
    const callProposal =
      oldCall && newCall && oldCall.id === newCall.id && rank[oldCall.status] > rank[newCall.status] ? oldCall : newCall;
    byId.set(message.id, { ...message, callProposal });
  }
  const messages = [...byId.values()].filter((message) => Date.parse(message.expiresAt) > Date.now());
  const proposals = new Map<string, ChatCallProposal>();
  const ranks = { pending: 0, accepted: 1, cancelled: 2 };
  for (const message of messages) {
    const call = message.callProposal;
    if (!call) continue;
    const old = proposals.get(call.id);
    if (!old || ranks[call.status] >= ranks[old.status]) proposals.set(call.id, call);
  }
  return messages
    .map((message) =>
      message.callProposal
        ? { ...message, callProposal: proposals.get(message.callProposal.id) ?? message.callProposal }
        : message,
    )
    .sort(compareChatMessages);
}
export function mergeChatHistory(current: ChatHistory | undefined, incoming: ChatHistory): ChatHistory {
  if (incoming.source === 'cache') return incoming;
  const old = current ?? emptyChatHistory();
  const resetBoundary = !old.initialized || old.messages.length === 0;
  return {
    source: 'cache',
    initialized: true,
    oldestId: incoming.source === 'older' || resetBoundary ? incoming.oldestId : old.oldestId,
    messages: mergeChatMessages(old.messages, incoming.messages),
    hasOlder: incoming.source === 'older' || resetBoundary ? incoming.hasOlder : old.hasOlder,
  };
}
export type FetchChatPage = (beforeId?: string) => Promise<ChatMessage[]>;
export async function fetchChatRecent(fetchPage: FetchChatPage, known: ChatMessage[]): Promise<ChatHistory> {
  let page = await fetchPage();
  const hasOlder = page.length === CHAT_HISTORY_PAGE_SIZE;
  const oldestId = page[0]?.id;
  const pages = [page];
  const knownIds = new Set(known.map((message) => message.id));
  const staleAttachments = new Set(known.filter(hasExpiredChatAttachment).map((message) => message.id));
  const consume = (messages: ChatMessage[]) => {
    for (const message of messages) staleAttachments.delete(message.id);
  };
  consume(page);
  const cursors = new Set<string>();
  while (
    known.length &&
    page.length === CHAT_HISTORY_PAGE_SIZE &&
    (!page.some((message) => knownIds.has(message.id)) || staleAttachments.size > 0)
  ) {
    const cursor = page[0]?.id;
    if (!cursor) break;
    if (cursors.has(cursor)) throw new Error('Chat cursor did not advance');
    cursors.add(cursor);
    page = await fetchPage(cursor);
    pages.unshift(page);
    consume(page);
  }
  return { source: 'recent', initialized: true, messages: mergeChatMessages([], pages.flat()), hasOlder, oldestId };
}

function hasExpiredChatAttachment(message: ChatMessage): boolean {
  return message.attachments.some((attachment) => {
    if (!attachment.publicUrl) return false;
    try {
      const expiry = new URL(attachment.publicUrl).searchParams.get('exp');
      return expiry !== null && Number(expiry) * 1000 <= Date.now();
    } catch {
      return false;
    }
  });
}
