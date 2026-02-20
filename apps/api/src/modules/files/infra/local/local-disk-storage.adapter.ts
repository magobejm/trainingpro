import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  FileStoragePort,
  StorageUploadInput,
  StorageUploadResult,
} from '../../domain/file-storage.port';

export class LocalDiskStorageAdapter implements FileStoragePort {
  constructor(private readonly baseDir: string) {}

  static fromEnv(): LocalDiskStorageAdapter {
    return new LocalDiskStorageAdapter(resolveUploadsBaseDir());
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const relativePath = normalizeRelativePath(input.path);
    const absolutePath = resolve(this.baseDir, relativePath);
    const targetDir = resolve(absolutePath, '..');
    await mkdir(targetDir, { recursive: true });
    await writeFile(absolutePath, input.data);
    return { path: relativePath };
  }

  async delete(path: string): Promise<void> {
    const relativePath = normalizeRelativePath(path);
    const absolutePath = resolve(this.baseDir, relativePath);
    await rm(absolutePath, { force: true });
  }

  getPublicUrl(path: string): string {
    const relativePath = normalizeRelativePath(path);
    return `${resolvePublicAssetBaseUrl()}/uploads/${relativePath}`;
  }
}

function resolveUploadsBaseDir(): string {
  return resolve(process.cwd(), 'apps/storage/uploads');
}

function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}

function normalizeRelativePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    throw new Error('Invalid storage path');
  }
  return normalized;
}
