import type { CallProposal, ChatAttachment, ChatMessage, ChatThread } from '@prisma/client';
import type {
  ChatAttachmentView,
  ChatCallProposalView,
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
  row: ChatMessage & { attachments: ChatAttachment[]; callProposal?: CallProposal | null },
  signPrivateUrl: (path: string) => string,
): ChatMessageView {
  return {
    attachments: row.attachments.map((attachment) => mapChatAttachment(attachment, signPrivateUrl)),
    callProposal: row.callProposal ? mapCallProposal(row.callProposal) : null,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    senderRole: row.senderRole,
    senderSubject: row.senderSubject,
    text: row.text,
    threadId: row.threadId,
  };
}

function mapCallProposal(row: CallProposal): ChatCallProposalView {
  return {
    date: row.date.toISOString().slice(0, 10),
    id: row.id,
    initiatedBy: row.initiatedBy,
    lastProposedBy: row.lastProposedBy,
    proposedTime: row.proposedTime,
    status: row.status,
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
