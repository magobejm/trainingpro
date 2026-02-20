"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendChatMessageDto = void 0;
const zod_1 = require("zod");
const attachmentSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1).max(160),
    kind: zod_1.z.enum(['AUDIO', 'IMAGE', 'PDF']),
    mimeType: zod_1.z.string().min(3).max(120),
    publicUrl: zod_1.z.string().url().nullable().optional(),
    sizeBytes: zod_1.z.number().int().positive(),
    storagePath: zod_1.z.string().min(3).max(500),
});
class SendChatMessageDto {
    static schema = zod_1.z.object({
        attachments: zod_1.z.array(attachmentSchema).max(5).optional(),
        text: zod_1.z.string().max(2000).optional(),
        threadId: zod_1.z.string().uuid(),
    });
    attachments;
    text;
    threadId;
}
exports.SendChatMessageDto = SendChatMessageDto;
