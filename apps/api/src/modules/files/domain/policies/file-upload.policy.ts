import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FILE_ALLOWED_MIME_TYPES,
  FILE_MAX_SIZE_BYTES,
  type AllowedAttachmentKind,
} from '../file.constants';

type UploadPolicyInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  threadId: string;
};

export type UploadPolicy = {
  kind: AllowedAttachmentKind;
  maxSizeBytes: number;
  path: string;
};

@Injectable()
export class FileUploadPolicy {
  createPolicy(input: UploadPolicyInput): UploadPolicy {
    this.ensureFileSize(input.sizeBytes);
    const kind = this.resolveKind(input.mimeType);
    return {
      kind,
      maxSizeBytes: FILE_MAX_SIZE_BYTES,
      path: this.buildStoragePath(input.threadId, input.fileName),
    };
  }

  private buildStoragePath(threadId: string, fileName: string): string {
    const safeName = toSafeName(fileName);
    return `chat/${threadId}/${Date.now()}-${safeName}`;
  }

  private ensureFileSize(sizeBytes: number): void {
    if (sizeBytes > FILE_MAX_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 1MB upload policy');
    }
  }

  private resolveKind(mimeType: string): AllowedAttachmentKind {
    const kind = FILE_ALLOWED_MIME_TYPES[mimeType as keyof typeof FILE_ALLOWED_MIME_TYPES];
    if (!kind) {
      throw new BadRequestException('Unsupported file mime type');
    }
    return kind;
  }
}

function toSafeName(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  return normalized.length > 0 ? normalized : 'attachment.bin';
}
