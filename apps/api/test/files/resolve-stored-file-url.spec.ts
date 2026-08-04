import { extractStorageObjectPath, resolveStoredFileUrl } from '../../src/modules/files/domain/resolve-stored-file-url';
import type { FileStoragePort } from '../../src/modules/files/domain/file-storage.port';

const storage: FileStoragePort = {
  delete: async () => undefined,
  getPublicUrl: (path) => `https://prod.supabase.co/storage/v1/object/public/trainerpro-prod/${path}`,
  upload: async () => ({ path: '' }),
};

describe('extractStorageObjectPath', () => {
  it('returns bare storage paths unchanged', () => {
    expect(extractStorageObjectPath('clients/avatars/client-1/photo.jpg')).toBe('clients/avatars/client-1/photo.jpg');
  });

  it('extracts object path from local Supabase dev URLs', () => {
    expect(
      extractStorageObjectPath(
        'http://127.0.0.1:54321/storage/v1/object/public/trainerpro-dev/clients/avatars/client-1/photo.jpg',
      ),
    ).toBe('clients/avatars/client-1/photo.jpg');
  });

  it('returns null for non-storage HTTP URLs', () => {
    expect(extractStorageObjectPath('https://api.example.com/assets/avatars/pixar-1.png')).toBeNull();
  });
});

describe('resolveStoredFileUrl', () => {
  it('rewrites legacy dev Supabase URLs using current storage config', () => {
    expect(
      resolveStoredFileUrl(
        'http://127.0.0.1:54321/storage/v1/object/public/trainerpro-dev/clients/avatars/client-1/photo.jpg',
        storage,
      ),
    ).toBe('https://prod.supabase.co/storage/v1/object/public/trainerpro-prod/clients/avatars/client-1/photo.jpg');
  });

  it('resolves bare storage paths', () => {
    expect(resolveStoredFileUrl('clients/progress/client-1/photo.jpg', storage)).toBe(
      'https://prod.supabase.co/storage/v1/object/public/trainerpro-prod/clients/progress/client-1/photo.jpg',
    );
  });

  it('keeps external asset URLs unchanged', () => {
    const url = 'https://api.example.com/assets/avatars/pixar-1.png';
    expect(resolveStoredFileUrl(url, storage)).toBe(url);
  });
});
