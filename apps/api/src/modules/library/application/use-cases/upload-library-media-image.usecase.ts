import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';

const MAX_IMAGE_SIZE_BYTES = 1_000_000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_BY_EXTENSION: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
};
const FILE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadLibraryMediaImageUseCase {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    context: AuthContext,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ imageUrl: string }> {
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
}

function validateImageFile(file: {
  mimetype: string;
  originalname: string;
  size: number;
}): void {
  const detectedMime = detectImageMime(file.mimetype, file.originalname);
  if (!detectedMime) {
    throw new BadRequestException('Unsupported image format');
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException('Image exceeds size limit');
  }
}

function detectImageMime(rawMime: string, originalname: string): null | string {
  const normalizedMime = normalizeMime(rawMime);
  if (normalizedMime && ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return normalizedMime;
  }
  return detectMimeFromExtension(originalname);
}

function normalizeMime(rawMime: string): null | string {
  const mime = rawMime.trim().toLowerCase();
  if (!mime) {
    return null;
  }
  return MIME_ALIASES[mime] ?? mime;
}

function detectMimeFromExtension(filename: string): null | string {
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

async function resolveCoachMembershipId(
  prisma: PrismaService,
  subject: string,
): Promise<string> {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      archivedAt: null,
      isActive: true,
      role: Role.COACH,
      user: { supabaseUid: subject },
    },
    select: { id: true },
  });
  if (!membership) {
    throw new BadRequestException('Coach membership not found');
  }
  return membership.id;
}

function buildImagePath(
  coachMembershipId: string,
  file: { mimetype: string; originalname: string },
): string {
  const extension = FILE_EXTENSIONS[file.mimetype] ?? 'jpg';
  const safeName = sanitizeName(file.originalname);
  return `library/images/${coachMembershipId}/${Date.now()}-${safeName}.${extension}`;
}

function sanitizeName(input: string): string {
  const base = input.replace(/\.[a-z0-9]+$/i, '');
  const normalized = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return normalized.length > 0 ? normalized : 'image';
}
