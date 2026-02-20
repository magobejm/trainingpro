import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';
import { UpdateClientUseCase } from './update-client.usecase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadClientAvatarUseCase {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
    private readonly updateClientUseCase: UpdateClientUseCase,
  ) {}

  async execute(
    context: AuthContext,
    clientId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ avatarUrl: string }> {
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
}

function validateAvatarFile(file: { mimetype: string; size: number }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('Unsupported avatar format');
  }
  if (file.size <= 0 || file.size > 2_000_000) {
    throw new BadRequestException('Avatar exceeds size limit');
  }
}

function buildAvatarPath(
  clientId: string,
  file: { mimetype: string; originalname: string },
): string {
  const extension = EXT_BY_MIME[file.mimetype] ?? 'jpg';
  const safeName = sanitizeName(file.originalname);
  return `clients/avatars/${clientId}/${Date.now()}-${safeName}.${extension}`;
}

function sanitizeName(originalName: string): string {
  const base = originalName.replace(/\.[a-z0-9]+$/i, '');
  const normalized = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return normalized.length > 0 ? normalized : 'avatar';
}
