import type {
  FileStoragePort,
  StorageUploadInput,
  StorageUploadResult,
} from '../../domain/file-storage.port';

export class NoopStorageAdapter implements FileStoragePort {
  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    return { path: input.path };
  }

  async delete(path: string): Promise<void> {
    void path;
    return;
  }

  getPublicUrl(path: string): string {
    return path;
  }
}
