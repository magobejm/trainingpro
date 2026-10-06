import type { ChatAttachment, ChatMessage, ChatThread } from '@prisma/client';
import type { ChatAttachmentView, ChatMessageView, ChatThreadView } from '../../domain/chat.repository.port';

export function mapChatThread(row: ChatThread): ChatThreadView {
  return {
    clientId: row.clientId,
    coachMembershipId: row.coachMembershipId,
    id: row.id,
    organizationId: row.organizationId,
    updatedAt: row.updatedAt,
  };
}

export function mapChatMessage(
  row: ChatMessage & { attachments: ChatAttachment[] },
  signPrivateUrl: (path: string) => string,
): ChatMessageView {
  return {
    attachments: row.attachments.map((attachment) => mapChatAttachment(attachment, signPrivateUrl)),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    senderRole: row.senderRole,
    senderSubject: row.senderSubject,
    text: row.text,
    threadId: row.threadId,
  };
}

function mapChatAttachment(row: ChatAttachment, signPrivateUrl: (path: string) => string): ChatAttachmentView {
  return {
    fileName: row.fileName,
    id: row.id,
    kind: row.kind,
    mimeType: row.mimeType,
    publicUrl: signAttachmentUrl(row.storagePath, signPrivateUrl),
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath,
  };
}

function signAttachmentUrl(path: string, signPrivateUrl: (path: string) => string): string | null {
  try {
    return signPrivateUrl(path);
  } catch {
    return null;
  }
}
