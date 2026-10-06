import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { FileStoragePort, StorageUploadInput, StorageUploadResult } from '../../domain/file-storage.port';
import type { PrivateFileDownload, PrivateFileStoragePort } from '../../domain/private-file-storage.port';
import { assertPrivateStoragePath, normalizeStoragePath } from '../../domain/private-storage-path';
import { contentTypeForPath } from '../../domain/storage-content-type';

export class LocalDiskStorageAdapter implements FileStoragePort, PrivateFileStoragePort {
  constructor(
    private readonly baseDir: string,
    private readonly isPublic: boolean,
  ) {}

  static fromEnv(): LocalDiskStorageAdapter {
    return new LocalDiskStorageAdapter(resolve(process.cwd(), 'apps/storage/uploads'), true);
  }

  static privateFromEnv(): LocalDiskStorageAdapter {
    return new LocalDiskStorageAdapter(resolveStorageDirectory('private'), false);
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const relativePath = this.resolvePath(input.path);
    const absolutePath = resolve(this.baseDir, relativePath);
    await mkdir(resolve(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, input.data);
    return { path: relativePath };
  }

  async delete(path: string): Promise<void> {
    const relativePath = this.resolvePath(path);
    await rm(resolve(this.baseDir, relativePath), { force: true });
  }

  async download(path: string): Promise<PrivateFileDownload | null> {
    const relativePath = assertPrivateStoragePath(path);
    try {
      const data = await readFile(resolve(this.baseDir, relativePath));
      return { contentType: contentTypeForPath(relativePath), data };
    } catch (error) {
      if (isMissingFile(error)) {
        return null;
      }
      throw error;
    }
  }

  getPublicUrl(path: string): string {
    const relativePath = normalizeStoragePath(path);
    return `${resolvePublicAssetBaseUrl()}/uploads/${relativePath}`;
  }

  private resolvePath(path: string): string {
    return this.isPublic ? normalizeStoragePath(path) : assertPrivateStoragePath(path);
  }
}

export function resolveStorageDirectory(name: string): string {
  const candidates = [
    resolve(process.cwd(), `apps/storage/${name}`),
    resolve(process.cwd(), `../storage/${name}`),
    resolve(process.cwd(), `../../apps/storage/${name}`),
  ];
  return candidates.find((item) => existsSync(item)) ?? resolve(process.cwd(), `../storage/${name}`);
}

function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
}
