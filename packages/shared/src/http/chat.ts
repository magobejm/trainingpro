import { z } from 'zod';

const chatAttachmentSchema = z
  .object({
    fileName: z.string(),
    id: z.string(),
    kind: z.enum(['AUDIO', 'IMAGE', 'PDF']),
    mimeType: z.string(),
    publicUrl: z.string().nullable(),
    sizeBytes: z.number(),
    storagePath: z.string(),
  })
  .strict();

export const chatCallProposalSchema = z
  .object({
    date: z.string(),
    id: z.string(),
    initiatedBy: z.enum(['COACH', 'CLIENT']),
    lastProposedBy: z.enum(['COACH', 'CLIENT']),
    proposedTime: z.string(),
    status: z.enum(['accepted', 'cancelled', 'pending']),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    attachments: z.array(chatAttachmentSchema),
    callProposal: chatCallProposalSchema.nullable(),
    createdAt: z.string(),
    expiresAt: z.string(),
    id: z.string(),
    senderRole: z.enum(['COACH', 'CLIENT']),
    senderSubject: z.string(),
    text: z.string().nullable(),
    threadId: z.string(),
  })
  .strict();

export const chatMessageListSchema = z.array(chatMessageSchema);

export type ChatAttachment = z.infer<typeof chatAttachmentSchema>;
export type ChatCallProposal = z.infer<typeof chatCallProposalSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatMessageList = z.infer<typeof chatMessageListSchema>;
