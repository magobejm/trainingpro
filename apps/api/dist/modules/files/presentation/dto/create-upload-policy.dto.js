"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUploadPolicyDto = void 0;
const zod_1 = require("zod");
class CreateUploadPolicyDto {
    static schema = zod_1.z.object({
        fileName: zod_1.z.string().min(1).max(160),
        mimeType: zod_1.z.string().min(3).max(120),
        sizeBytes: zod_1.z.number().int().positive(),
        threadId: zod_1.z.string().uuid(),
    });
    fileName;
    mimeType;
    sizeBytes;
    threadId;
}
exports.CreateUploadPolicyDto = CreateUploadPolicyDto;
