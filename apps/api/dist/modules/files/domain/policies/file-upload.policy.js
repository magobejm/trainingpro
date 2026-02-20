"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadPolicy = void 0;
const common_1 = require("@nestjs/common");
const file_constants_1 = require("../file.constants");
let FileUploadPolicy = class FileUploadPolicy {
    createPolicy(input) {
        this.ensureFileSize(input.sizeBytes);
        const kind = this.resolveKind(input.mimeType);
        return {
            kind,
            maxSizeBytes: file_constants_1.FILE_MAX_SIZE_BYTES,
            path: this.buildStoragePath(input.threadId, input.fileName),
        };
    }
    buildStoragePath(threadId, fileName) {
        const safeName = toSafeName(fileName);
        return `chat/${threadId}/${Date.now()}-${safeName}`;
    }
    ensureFileSize(sizeBytes) {
        if (sizeBytes > file_constants_1.FILE_MAX_SIZE_BYTES) {
            throw new common_1.BadRequestException('File exceeds 1MB upload policy');
        }
    }
    resolveKind(mimeType) {
        const kind = file_constants_1.FILE_ALLOWED_MIME_TYPES[mimeType];
        if (!kind) {
            throw new common_1.BadRequestException('Unsupported file mime type');
        }
        return kind;
    }
};
exports.FileUploadPolicy = FileUploadPolicy;
exports.FileUploadPolicy = FileUploadPolicy = __decorate([
    (0, common_1.Injectable)()
], FileUploadPolicy);
function toSafeName(input) {
    const normalized = input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    return normalized.length > 0 ? normalized : 'attachment.bin';
}
