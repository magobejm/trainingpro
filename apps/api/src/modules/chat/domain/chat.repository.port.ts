export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

export type ChatAttachmentInput = {
  fileName: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  publicUrl?: null | string;
  sizeBytes: number;
  storagePath: string;
};

export type SendChatMessageInput = {
  attachments?: ChatAttachmentInput[];
  text?: string;
  threadId: string;
};

export type ResolveChatThreadInput = {
  clientId?: string;
};

export type ChatAttachmentView = {
  fileName: string;
  id: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  publicUrl: null | string;
  sizeBytes: number;
  storagePath: string;
};

export type ChatMessageView = {
  attachments: ChatAttachmentView[];
  createdAt: Date;
  expiresAt: Date;
  id: string;
  senderRole: 'COACH' | 'CLIENT';
  senderSubject: string;
  text: null | string;
  threadId: string;
};

export type ChatThreadView = {
  clientId: string;
  coachMembershipId: string;
  id: string;
  organizationId: string;
  updatedAt: Date;
};

export type ChatRepositoryPort = {
  listMessagesByThread(
    context: import('../../../common/auth-context/auth-context').AuthContext,
    threadId: string,
  ): Promise<ChatMessageView[]>;
  resolveThread(
    context: import('../../../common/auth-context/auth-context').AuthContext,
    input: ResolveChatThreadInput,
  ): Promise<ChatThreadView>;
  sendMessage(
    context: import('../../../common/auth-context/auth-context').AuthContext,
    input: SendChatMessageInput,
  ): Promise<ChatMessageView>;
};
