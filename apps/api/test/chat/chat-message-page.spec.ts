import { ascendingByCreatedAt } from '../../src/modules/chat/domain/chat-message-page';
import { ListChatMessagesQueryDto } from '../../src/modules/chat/presentation/dto/list-chat-messages-query.dto';

const threadId = '22222222-2222-4222-8222-222222222222';

describe('chat message page order', () => {
  test('returns the newest page in ascending order', () => {
    const newest = at('2026-03-03T00:00:00.000Z');
    const middle = at('2026-02-02T00:00:00.000Z');
    const oldest = at('2026-01-01T00:00:00.000Z');
    expect(ascendingByCreatedAt([newest, oldest, middle]).map((row) => row.id)).toEqual(['old', 'mid', 'new']);
  });
});

describe('chat before cursor', () => {
  test('accepts an offset datetime and rejects a date without time', () => {
    const accepted = ListChatMessagesQueryDto.schema.safeParse({ before: '2026-03-01T00:00:00.000Z', threadId });
    const rejected = ListChatMessagesQueryDto.schema.safeParse({ before: '2026-03-01', threadId });
    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(false);
  });
});

function at(createdAt: string) {
  const id = createdAt.startsWith('2026-03') ? 'new' : createdAt.startsWith('2026-02') ? 'mid' : 'old';
  return { createdAt: new Date(createdAt), id };
}
