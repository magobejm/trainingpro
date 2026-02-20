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
exports.UploadClientAvatarUseCase = void 0;
const common_1 = require("@nestjs/common");
const file_storage_port_1 = require("../../../files/domain/file-storage.port");
const update_client_usecase_1 = require("./update-client.usecase");
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
let UploadClientAvatarUseCase = class UploadClientAvatarUseCase {
    storage;
    updateClientUseCase;
    constructor(storage, updateClientUseCase) {
        this.storage = storage;
        this.updateClientUseCase = updateClientUseCase;
    }
    async execute(context, clientId, file) {
        validateAvatarFile(file);
        const path = buildAvatarPath(clientId, file);
        await this.storage.upload({
            contentType: file.mimetype,
            data: file.buffer,
            path,
            upsert: true,
        });
        const avatarUrl = this.storage.getPublicUrl(path);
        await this.updateClientUseCase.execute(context, clientId, { avatarUrl });
        return { avatarUrl };
    }
};
exports.UploadClientAvatarUseCase = UploadClientAvatarUseCase;
exports.UploadClientAvatarUseCase = UploadClientAvatarUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(file_storage_port_1.FILE_STORAGE)),
    __metadata("design:paramtypes", [Object, update_client_usecase_1.UpdateClientUseCase])
], UploadClientAvatarUseCase);
function validateAvatarFile(file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new common_1.BadRequestException('Unsupported avatar format');
    }
    if (file.size <= 0 || file.size > 2_000_000) {
        throw new common_1.BadRequestException('Avatar exceeds size limit');
    }
}
function buildAvatarPath(clientId, file) {
    const extension = EXT_BY_MIME[file.mimetype] ?? 'jpg';
    const safeName = sanitizeName(file.originalname);
    return `clients/avatars/${clientId}/${Date.now()}-${safeName}.${extension}`;
}
function sanitizeName(originalName) {
    const base = originalName.replace(/\.[a-z0-9]+$/i, '');
    const normalized = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return normalized.length > 0 ? normalized : 'avatar';
}
