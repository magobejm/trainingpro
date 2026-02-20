export const CHAT_TTL_REPOSITORY = Symbol('CHAT_TTL_REPOSITORY');

export type ExpiredChatAttachment = {
  id: string;
  storagePath: string;
};

export type ChatTtlRepositoryPort = {
  deleteAttachments(ids: string[]): Promise<number>;
  deleteExpiredMessages(now: Date): Promise<number>;
  findExpiredAttachments(now: Date, limit: number): Promise<ExpiredChatAttachment[]>;
};
