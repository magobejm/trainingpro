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
exports.UploadLibraryMediaImageUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const file_storage_port_1 = require("../../../files/domain/file-storage.port");
const MAX_IMAGE_SIZE_BYTES = 1_000_000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_BY_EXTENSION = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};
const MIME_ALIASES = {
    'image/jpg': 'image/jpeg',
    'image/pjpeg': 'image/jpeg',
};
const FILE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
let UploadLibraryMediaImageUseCase = class UploadLibraryMediaImageUseCase {
    storage;
    prisma;
    constructor(storage, prisma) {
        this.storage = storage;
        this.prisma = prisma;
    }
    async execute(context, file) {
        validateImageFile(file);
        const coachMembershipId = await resolveCoachMembershipId(this.prisma, context.subject);
        const path = buildImagePath(coachMembershipId, file);
        await this.storage.upload({
            contentType: file.mimetype,
            data: file.buffer,
            path,
            upsert: true,
        });
        return { imageUrl: this.storage.getPublicUrl(path) };
    }
};
exports.UploadLibraryMediaImageUseCase = UploadLibraryMediaImageUseCase;
exports.UploadLibraryMediaImageUseCase = UploadLibraryMediaImageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(file_storage_port_1.FILE_STORAGE)),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], UploadLibraryMediaImageUseCase);
function validateImageFile(file) {
    const detectedMime = detectImageMime(file.mimetype, file.originalname);
    if (!detectedMime) {
        throw new common_1.BadRequestException('Unsupported image format');
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new common_1.BadRequestException('Image exceeds size limit');
    }
}
function detectImageMime(rawMime, originalname) {
    const normalizedMime = normalizeMime(rawMime);
    if (normalizedMime && ALLOWED_MIME_TYPES.includes(normalizedMime)) {
        return normalizedMime;
    }
    return detectMimeFromExtension(originalname);
}
function normalizeMime(rawMime) {
    const mime = rawMime.trim().toLowerCase();
    if (!mime) {
        return null;
    }
    return MIME_ALIASES[mime] ?? mime;
}
function detectMimeFromExtension(filename) {
    const extension = filename.split('.').pop()?.trim().toLowerCase();
    if (!extension) {
        return null;
    }
    const mime = MIME_BY_EXTENSION[extension];
    if (!mime) {
        return null;
    }
    return ALLOWED_MIME_TYPES.includes(mime) ? mime : null;
}
async function resolveCoachMembershipId(prisma, subject) {
    const membership = await prisma.organizationMember.findFirst({
        where: {
            archivedAt: null,
            isActive: true,
            role: client_1.Role.COACH,
            user: { supabaseUid: subject },
        },
        select: { id: true },
    });
    if (!membership) {
        throw new common_1.BadRequestException('Coach membership not found');
    }
    return membership.id;
}
function buildImagePath(coachMembershipId, file) {
    const extension = FILE_EXTENSIONS[file.mimetype] ?? 'jpg';
    const safeName = sanitizeName(file.originalname);
    return `library/images/${coachMembershipId}/${Date.now()}-${safeName}.${extension}`;
}
function sanitizeName(input) {
    const base = input.replace(/\.[a-z0-9]+$/i, '');
    const normalized = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return normalized.length > 0 ? normalized : 'image';
}
