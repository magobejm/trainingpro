import type { ChatAttachment, ChatMessage, ChatThread } from '@prisma/client';
import type {
  ChatAttachmentView,
  ChatMessageView,
  ChatThreadView,
} from '../../domain/chat.repository.port';

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
): ChatMessageView {
  return {
    attachments: row.attachments.map(mapChatAttachment),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    senderRole: row.senderRole,
    senderSubject: row.senderSubject,
    text: row.text,
    threadId: row.threadId,
  };
}

function mapChatAttachment(row: ChatAttachment): ChatAttachmentView {
  return {
    fileName: row.fileName,
    id: row.id,
    kind: row.kind,
    mimeType: row.mimeType,
    publicUrl: row.publicUrl,
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath,
  };
}
