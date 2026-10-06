import { createChunkedStorage, type KvBackend } from '../chunked-storage';

describe('createChunkedStorage', () => {
  it('stores a 5 KB value in 3 parts and reads it back', async () => {
    const backend = createMemoryBackend();
    const storage = createChunkedStorage(backend);
    const value = 'a'.repeat(5000);

    await storage.setItem('session', value);

    expect(backend.items.get('session.count')).toBe('3');
    expect(backend.items.has('session.0')).toBe(true);
    expect(backend.items.has('session.1')).toBe(true);
    expect(backend.items.has('session.2')).toBe(true);
    expect(backend.items.has('session.3')).toBe(false);
    await expect(storage.getItem('session')).resolves.toBe(value);
  });

  it('drops leftover parts when a shorter value replaces a longer one', async () => {
    const backend = createMemoryBackend();
    const storage = createChunkedStorage(backend);

    await storage.setItem('session', 'a'.repeat(5000));
    await storage.setItem('session', 'short');

    expect(backend.items.get('session.count')).toBe('1');
    expect(backend.items.has('session.1')).toBe(false);
    expect(backend.items.has('session.2')).toBe(false);
    await expect(storage.getItem('session')).resolves.toBe('short');
  });

  it('returns null when a part is missing', async () => {
    const backend = createMemoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem('session', 'a'.repeat(5000));
    backend.items.delete('session.1');

    await expect(storage.getItem('session')).resolves.toBeNull();
  });

  it('removes the count and every part', async () => {
    const backend = createMemoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem('session', 'a'.repeat(5000));

    await storage.removeItem('session');

    expect(backend.items.size).toBe(0);
  });
});

function createMemoryBackend(): KvBackend & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    removeItem: (key) => {
      items.delete(key);
      return Promise.resolve();
    },
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
  };
}
