import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import { CreateClientProgressPhotoUseCase } from './create-client-progress-photo.usecase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadClientProgressPhotoUseCase {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
    private readonly createClientProgressPhotoUseCase: CreateClientProgressPhotoUseCase,
  ) {}

  async execute(
    context: AuthContext,
    clientId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<ClientProgressPhoto> {
    validatePhotoFile(file);
    const path = buildPhotoPath(clientId, file);
    await this.storage.upload({
      contentType: file.mimetype,
      data: file.buffer,
      path,
      upsert: false,
    });
    return this.createClientProgressPhotoUseCase.execute(context, clientId, path);
  }
}

function validatePhotoFile(file: { mimetype: string; size: number }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('Unsupported progress photo format');
  }
  if (file.size <= 0 || file.size > 4_000_000) {
    throw new BadRequestException('Progress photo exceeds size limit');
  }
}

function buildPhotoPath(
  clientId: string,
  file: { mimetype: string; originalname: string },
): string {
  const extension = EXT_BY_MIME[file.mimetype] ?? 'jpg';
  const safeName = sanitizeName(file.originalname);
  return `clients/progress/${clientId}/${Date.now()}-${safeName}.${extension}`;
}

function sanitizeName(originalName: string): string {
  const base = originalName.replace(/\.[a-z0-9]+$/i, '');
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return normalized.length > 0 ? normalized : 'progress-photo';
}
