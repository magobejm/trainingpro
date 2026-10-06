import { SendChatMessageDto } from '../../src/modules/chat/presentation/dto/send-chat-message.dto';
import { mapChatMessage } from '../../src/modules/chat/infra/prisma/chat-prisma.mappers';

const THREAD_ID = '11111111-1111-4111-8111-111111111111';

describe('SendChatMessageDto', () => {
  it('rejects an attachment stored outside its thread', () => {
    expect(() =>
      SendChatMessageDto.schema.parse({
        attachments: [attachment(`chat/22222222-2222-4222-8222-222222222222/file.jpg`)],
        threadId: THREAD_ID,
      }),
    ).toThrow(/Attachment path must stay inside this chat thread/);
  });

  it('accepts a path inside the thread and ignores the client public URL when mapping', () => {
    const parsed = SendChatMessageDto.schema.parse({
      attachments: [
        {
          ...attachment(`chat/${THREAD_ID}/file.jpg`),
          publicUrl: 'https://evil.example/stolen.jpg',
        },
      ],
      threadId: THREAD_ID,
    });
    expect(parsed.attachments?.[0]?.storagePath).toBe(`chat/${THREAD_ID}/file.jpg`);

    const view = mapChatMessage(
      {
        attachments: [
          {
            expiresAt: new Date('2026-01-01T00:00:00.000Z'),
            fileName: 'file.jpg',
            id: 'a1',
            kind: 'IMAGE',
            messageId: 'm1',
            mimeType: 'image/jpeg',
            publicUrl: 'https://evil.example/stolen.jpg',
            sizeBytes: 10,
            storagePath: `chat/${THREAD_ID}/file.jpg`,
          },
        ],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
        id: 'm1',
        senderRole: 'COACH',
        senderSubject: 'coach-1',
        text: null,
        threadId: THREAD_ID,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      } as never,
      (path) => `signed:${path}`,
    );
    expect(view.attachments[0]?.publicUrl).toBe(`signed:chat/${THREAD_ID}/file.jpg`);
  });
});

function attachment(storagePath: string) {
  return {
    fileName: 'file.jpg',
    kind: 'IMAGE' as const,
    mimeType: 'image/jpeg',
    sizeBytes: 10,
    storagePath,
  };
}
