"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurgeExpiredChatDataUseCase = void 0;
const common_1 = require("@nestjs/common");
const file_storage_port_1 = require("../../../files/domain/file-storage.port");
const chat_ttl_repository_port_1 = require("../../domain/chat-ttl.repository.port");
const PURGE_BATCH_SIZE = 200;
let PurgeExpiredChatDataUseCase = class PurgeExpiredChatDataUseCase {
    repository;
    fileStorage;
    constructor(repository, fileStorage) {
        this.repository = repository;
        this.fileStorage = fileStorage;
    }
    async execute(now = new Date()) {
        const attachments = await this.repository.findExpiredAttachments(now, PURGE_BATCH_SIZE);
        await this.deleteStorageObjects(attachments.map((item) => item.storagePath));
        const attachmentRowsDeleted = await this.repository.deleteAttachments(attachments.map((item) => item.id));
        const messageRowsDeleted = await this.repository.deleteExpiredMessages(now);
        return {
            attachmentRowsDeleted,
            messageRowsDeleted,
            storageObjectsDeleted: attachments.length,
        };
    }
    async deleteStorageObjects(paths) {
        for (const path of paths) {
            await this.safeDelete(path);
        }
    }
    async safeDelete(path) {
        try {
            await this.fileStorage.delete(path);
        }
        catch {
            return;
        }
    }
};
exports.PurgeExpiredChatDataUseCase = PurgeExpiredChatDataUseCase;
exports.PurgeExpiredChatDataUseCase = PurgeExpiredChatDataUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(chat_ttl_repository_port_1.CHAT_TTL_REPOSITORY)),
    __param(1, (0, common_1.Inject)(file_storage_port_1.FILE_STORAGE)),
    __metadata("design:paramtypes", [Object, Object])
], PurgeExpiredChatDataUseCase);
