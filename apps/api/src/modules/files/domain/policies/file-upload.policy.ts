import { BadRequestException, Injectable } from '@nestjs/common';
import { FILE_ALLOWED_MIME_TYPES, maxSizeForKind, type AllowedAttachmentKind } from '../file.constants';

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
    const kind = this.resolveKind(input.mimeType);
    const maxSizeBytes = maxSizeForKind(kind);
    this.ensureFileSize(input.sizeBytes, maxSizeBytes);
    return {
      kind,
      maxSizeBytes,
      path: this.buildStoragePath(input.threadId, input.fileName),
    };
  }

  private buildStoragePath(threadId: string, fileName: string): string {
    const safeName = toSafeName(fileName);
    return `chat/${threadId}/${Date.now()}-${safeName}`;
  }

  private ensureFileSize(sizeBytes: number, maxSizeBytes: number): void {
    if (sizeBytes > maxSizeBytes) {
      throw new BadRequestException(`File exceeds ${Math.round(maxSizeBytes / 1_000_000)}MB upload policy`);
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
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
  return normalized.length > 0 ? normalized : 'attachment.bin';
}
