import type { StateStorage } from 'zustand/middleware';
import { createChunkedStorage, type KvBackend } from './chunked-storage';

const memoryItems = new Map<string, string>();

export function createAuthStateStorage(): StateStorage {
  const browserStorage = readBrowserStorage();
  if (browserStorage) {
    return browserStorage;
  }
  const env = process.env as Record<string, string | undefined>;
  if (env['JEST_WORKER_ID']) {
    return createMemoryStateStorage();
  }
  return createChunkedStorage(createSecureStoreBackend());
}

function readBrowserStorage(): StateStorage | null {
  const storage = (globalThis as { localStorage?: StateStorage }).localStorage;
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }
  return storage;
}

function createSecureStoreBackend(): KvBackend {
  return {
    getItem: (key) => readSecureItem(key),
    removeItem: (key) => removeSecureItem(key),
    setItem: (key, value) => writeSecureItem(key, value),
  };
}

async function readSecureItem(key: string): Promise<string | null> {
  const secureStore = await import('expo-secure-store');
  return secureStore.getItemAsync(key);
}

async function writeSecureItem(key: string, value: string): Promise<void> {
  const secureStore = await import('expo-secure-store');
  await secureStore.setItemAsync(key, value);
}

async function removeSecureItem(key: string): Promise<void> {
  const secureStore = await import('expo-secure-store');
  await secureStore.deleteItemAsync(key);
}

function createMemoryStateStorage(): StateStorage {
  return {
    getItem: (name) => memoryItems.get(name) ?? null,
    removeItem: (name) => {
      memoryItems.delete(name);
    },
    setItem: (name, value) => {
      memoryItems.set(name, value);
    },
  };
}
