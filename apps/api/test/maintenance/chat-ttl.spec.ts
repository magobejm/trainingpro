import { PurgeExpiredChatDataUseCase } from '../../src/modules/maintenance/application/use-cases/purge-expired-chat-data.usecase';

describe('Chat TTL purge', () => {
  it('purges expired rows and is idempotent on second run', async () => {
    const repository = createRepository();
    const storage = createStorage();
    const useCase = new PurgeExpiredChatDataUseCase(repository, storage);

    const first = await useCase.execute(new Date('2026-02-18T10:00:00.000Z'));
    const second = await useCase.execute(new Date('2026-02-18T10:00:00.000Z'));

    expect(first).toEqual({
      attachmentRowsDeleted: 2,
      messageRowsDeleted: 2,
      storageObjectsDeleted: 2,
    });
    expect(second).toEqual({
      attachmentRowsDeleted: 0,
      messageRowsDeleted: 0,
      storageObjectsDeleted: 0,
    });
    expect(storage.deleted).toEqual(['chat/t-1/a.jpg', 'chat/t-1/b.pdf']);
  });
});

function createRepository() {
  const attachments = [
    { expiresAt: new Date('2026-02-10T10:00:00.000Z'), id: 'a1', storagePath: 'chat/t-1/a.jpg' },
    { expiresAt: new Date('2026-02-11T10:00:00.000Z'), id: 'a2', storagePath: 'chat/t-1/b.pdf' },
  ];
  const messages = [
    { expiresAt: new Date('2026-02-10T10:00:00.000Z'), id: 'm1' },
    { expiresAt: new Date('2026-02-11T10:00:00.000Z'), id: 'm2' },
  ];
  return {
    deleteAttachments: async (ids: string[]) => {
      const keep = attachments.filter((item) => !ids.includes(item.id));
      const deleted = attachments.length - keep.length;
      attachments.length = 0;
      attachments.push(...keep);
      return deleted;
    },
    deleteExpiredMessages: async (now: Date) => {
      const keep = messages.filter((item) => item.expiresAt > now);
      const deleted = messages.length - keep.length;
      messages.length = 0;
      messages.push(...keep);
      return deleted;
    },
    findExpiredAttachments: async (now: Date, limit: number) =>
      attachments.filter((item) => item.expiresAt <= now).slice(0, limit),
  };
}

function createStorage() {
  return {
    deleted: [] as string[],
    delete: async function (path: string) {
      this.deleted.push(path);
    },
    getPublicUrl: () => '',
    upload: async () => ({ path: '' }),
  };
}
