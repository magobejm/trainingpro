import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { z, ZodError } from 'zod';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { FILE_ALLOWED_MIME_TYPES } from '../../../files/domain/file.constants';
import { FileUploadPolicy } from '../../../files/domain/policies/file-upload.policy';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../../files/domain/private-file-storage.port';
import { ChatThreadAccessService } from '../../infra/prisma/chat-thread-access.service';

export type UploadChatFileInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  threadId: string;
};

export type UploadedChatFile = {
  fileName: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  aac: 'audio/aac',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  wav: 'audio/wav',
  webp: 'image/webp',
};

@Injectable()
export class UploadChatFileUseCase {
  constructor(
    private readonly threadAccess: ChatThreadAccessService,
    private readonly uploadPolicy: FileUploadPolicy,
    @Inject(PRIVATE_FILE_STORAGE)
    private readonly storage: PrivateFileStoragePort,
  ) {}

  async execute(context: AuthContext, input: UploadChatFileInput): Promise<UploadedChatFile> {
    this.assertRole(context.activeRole);
    const threadId = readThreadId(input.threadId);
    await this.threadAccess.assertAccess(context, threadId);
    const mimeType = resolveMimeType(input.mimeType, input.fileName);
    const sizeBytes = input.buffer.length;
    if (sizeBytes <= 0) {
      throw new BadRequestException('Missing chat file');
    }
    const fileName = readFileName(input.fileName);
    const policy = this.uploadPolicy.createPolicy({ fileName, mimeType, sizeBytes, threadId });
    await this.storage.upload({
      contentType: mimeType,
      data: input.buffer,
      path: policy.path,
    });
    await this.confirmStored(policy.path, sizeBytes);
    return {
      fileName,
      kind: policy.kind,
      mimeType,
      sizeBytes,
      storagePath: policy.path,
    };
  }

  private assertRole(role: AuthContext['activeRole']): void {
    if (role === 'client' || role === 'coach') {
      return;
    }
    throw new ForbiddenException('Unsupported role for file upload policy');
  }

  private async confirmStored(path: string, sizeBytes: number): Promise<void> {
    const stored = await this.storage.download(path);
    if (stored && stored.data.length === sizeBytes) {
      return;
    }
    await this.storage.delete(path).catch(() => undefined);
    throw new BadRequestException('Uploaded file could not be verified');
  }
}

function readThreadId(threadId: string): string {
  try {
    return z.string().uuid().parse(threadId);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException('Invalid chat thread');
    }
    throw error;
  }
}

function readFileName(fileName: string): string {
  const trimmed = fileName.trim().slice(0, 160);
  return trimmed.length > 0 ? trimmed : 'attachment';
}

function resolveMimeType(rawMime: string, fileName: string): string {
  const normalized = rawMime.split(';')[0]?.trim().toLowerCase() ?? '';
  if (isAllowedMime(normalized)) {
    return normalized;
  }
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const fromExtension = MIME_BY_EXTENSION[extension] ?? '';
  if (isAllowedMime(fromExtension)) {
    return fromExtension;
  }
  throw new BadRequestException('Unsupported file mime type');
}

function isAllowedMime(mimeType: string): mimeType is keyof typeof FILE_ALLOWED_MIME_TYPES {
  return Object.prototype.hasOwnProperty.call(FILE_ALLOWED_MIME_TYPES, mimeType);
}
