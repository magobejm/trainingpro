import { mergeChatMessages, mergeChatHistory, fetchChatRecent, emptyChatHistory } from '../chat-history';
import type { ChatMessage } from '../http/chat';
const at = (n: number): ChatMessage => ({
  id: String(n).padStart(4, '0'),
  createdAt: new Date(1700000000000 + n).toISOString(),
  expiresAt: '2099-01-01T00:00:00Z',
  threadId: 'thread',
  senderRole: 'COACH',
  senderSubject: 'coach',
  text: String(n),
  attachments: [],
  callProposal: null,
});
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => at(from + i));
test('merges overlapping pages and refreshes existing messages', () => {
  const merged = mergeChatMessages(range(1, 60), [{ ...at(60), text: 'updated' }, ...range(61, 70)]);
  expect(merged).toHaveLength(70);
  expect(merged[59]?.text).toBe('updated');
});
test('orders tied timestamps by id', () => {
  expect(mergeChatMessages([], [at(2), { ...at(1), createdAt: at(2).createdAt }]).map((x) => x.id)).toEqual([
    '0001',
    '0002',
  ]);
});
test('bridges a burst of more than 50 new messages', async () => {
  const all = range(1, 180);
  const fetchPage = jest.fn(async (beforeId?: string) => {
    const end = beforeId ? all.findIndex((m) => m.id === beforeId) : all.length;
    return all.slice(Math.max(0, end - 50), end);
  });
  const result = await fetchChatRecent(fetchPage, range(1, 50));
  expect(mergeChatMessages(range(1, 50), result.messages)).toHaveLength(180);
  expect(fetchPage).toHaveBeenCalledTimes(3);
});
test('merges a recent response onto history that arrived while polling', () => {
  const old = mergeChatHistory(emptyChatHistory(), {
    source: 'recent',
    initialized: true,
    messages: range(51, 100),
    hasOlder: true,
  });
  const older = mergeChatHistory(old, { source: 'older', initialized: true, messages: range(1, 50), hasOlder: true });
  const next = mergeChatHistory(older, { source: 'recent', initialized: true, messages: range(101, 110), hasOlder: false });
  expect(next.messages).toHaveLength(110);
  expect(next.hasOlder).toBe(true);
});
test('exhaustion of history survives later refreshes', () => {
  const old = mergeChatHistory(emptyChatHistory(), {
    source: 'recent',
    initialized: true,
    messages: range(1, 20),
    hasOlder: false,
  });
  expect(
    mergeChatHistory(old, { source: 'recent', initialized: true, messages: range(21, 70), hasOlder: true }).hasOlder,
  ).toBe(false);
});
test('a stale history card cannot make a cancelled invitation pending', () => {
  const proposal = {
    id: 'call',
    date: '2026-10-20',
    initiatedBy: 'COACH',
    lastProposedBy: 'COACH',
    proposedTime: '09:00',
    status: 'cancelled',
  } as const;
  const merged = mergeChatMessages(
    [{ ...at(1), callProposal: proposal }],
    [{ ...at(1), callProposal: { ...proposal, status: 'pending' } }],
  );
  expect(merged[0]?.callProposal?.status).toBe('cancelled');
});
test('a failed bridge rejects rather than publishing a timeline with holes', async () => {
  let n = 0;
  const fetchPage = async () => {
    if (n++) throw new Error('offline');
    return range(101, 150);
  };
  await expect(fetchChatRecent(fetchPage, range(1, 50))).rejects.toThrow('offline');
});

test('opens the history boundary when an initially empty chat receives a full page', () => {
  const empty = mergeChatHistory(emptyChatHistory(), { source: 'recent', initialized: true, messages: [], hasOlder: false });
  const received = mergeChatHistory(empty, {
    source: 'recent',
    initialized: true,
    messages: range(51, 100),
    hasOlder: true,
    oldestId: '0051',
  });
  expect(received.hasOlder).toBe(true);
  expect(received.oldestId).toBe('0051');
});

test('propagates proposal status from a new chat message to its historical card', () => {
  const pending = {
    id: 'call',
    date: '2026-10-20',
    initiatedBy: 'COACH',
    lastProposedBy: 'COACH',
    proposedTime: '09:00',
    status: 'pending',
  } as const;
  const result = mergeChatMessages(
    [{ ...at(1), callProposal: pending }],
    [{ ...at(100), callProposal: { ...pending, status: 'cancelled' } }],
  );
  expect(result[0]?.callProposal?.status).toBe('cancelled');
});
test('renews expired signed links on historical pages during polling', async () => {
  const all = range(1, 150);
  const file = {
    id: 'file',
    fileName: 'file.pdf',
    kind: 'PDF',
    mimeType: 'application/pdf',
    publicUrl: 'https://local/files/private/a?exp=1&sig=old',
    sizeBytes: 1,
    storagePath: 'a',
  } as const;
  const known = range(1, 150);
  known[0] = { ...at(1), attachments: [file] };
  all[0] = { ...at(1), attachments: [{ ...file, publicUrl: 'https://local/files/private/a?exp=9999999999&sig=new' }] };
  const fetchPage = jest.fn(async (beforeId?: string) => {
    const end = beforeId ? all.findIndex((m) => m.id === beforeId) : all.length;
    return all.slice(Math.max(0, end - 50), end);
  });
  const result = await fetchChatRecent(fetchPage, known);
  expect(mergeChatMessages(known, result.messages)[0]?.attachments[0]?.publicUrl).toContain('sig=new');
  expect(fetchPage).toHaveBeenCalledTimes(3);
});
