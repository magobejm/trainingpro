import {
  extractStorageObjectPath,
  resolveStoredFileUrl,
  type StoredFileUrls,
} from '../../src/modules/files/domain/resolve-stored-file-url';

const urls: StoredFileUrls = {
  getPublicUrl: (path) => `https://prod.supabase.co/storage/v1/object/public/trainerpro-prod/${path}`,
  signPrivateUrl: (path) => `https://api.example/files/private/${path}?exp=1&sig=abc`,
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
  it('signs private paths and legacy Supabase URLs for client media', () => {
    expect(resolveStoredFileUrl('clients/progress/client-1/photo.jpg', urls)).toBe(
      'https://api.example/files/private/clients/progress/client-1/photo.jpg?exp=1&sig=abc',
    );
    expect(
      resolveStoredFileUrl(
        'http://127.0.0.1:54321/storage/v1/object/public/trainerpro-dev/clients/avatars/client-1/photo.jpg',
        urls,
      ),
    ).toBe('https://api.example/files/private/clients/avatars/client-1/photo.jpg?exp=1&sig=abc');
  });

  it('keeps library uploads on the public bucket', () => {
    expect(resolveStoredFileUrl('library/images/coach-1/photo.jpg', urls)).toBe(
      'https://prod.supabase.co/storage/v1/object/public/trainerpro-prod/library/images/coach-1/photo.jpg',
    );
  });

  it('keeps external asset URLs unchanged', () => {
    const url = 'https://api.example.com/assets/avatars/pixar-1.png';
    expect(resolveStoredFileUrl(url, urls)).toBe(url);
  });
});
