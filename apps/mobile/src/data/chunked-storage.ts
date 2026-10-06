import type { StateStorage } from 'zustand/middleware';

const CHUNK_CHARS = 1800;

export type KvBackend = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function createChunkedStorage(backend: KvBackend): StateStorage {
  return {
    getItem: (key) => readChunkedValue(backend, key),
    removeItem: (key) => removeChunkedValue(backend, key),
    setItem: (key, value) => writeChunkedValue(backend, key, value),
  };
}

export function splitStorageValue(value: string): string[] {
  if (value.length === 0) {
    return [''];
  }
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += CHUNK_CHARS) {
    chunks.push(value.slice(index, index + CHUNK_CHARS));
  }
  return chunks;
}

async function readChunkedValue(backend: KvBackend, key: string): Promise<string | null> {
  const count = await readChunkCount(backend, key);
  if (count === null) {
    return null;
  }
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const part = await backend.getItem(chunkKey(key, index));
    if (part === null) {
      return null;
    }
    parts.push(part);
  }
  return parts.join('');
}

async function writeChunkedValue(backend: KvBackend, key: string, value: string): Promise<void> {
  const chunks = splitStorageValue(value);
  const previousCount = await readChunkCount(backend, key);
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index] ?? '';
    await backend.setItem(chunkKey(key, index), chunk);
  }
  await backend.setItem(countKey(key), String(chunks.length));
  if (previousCount === null || previousCount <= chunks.length) {
    return;
  }
  for (let index = chunks.length; index < previousCount; index += 1) {
    await backend.removeItem(chunkKey(key, index));
  }
}

async function removeChunkedValue(backend: KvBackend, key: string): Promise<void> {
  const count = await readChunkCount(backend, key);
  if (count !== null) {
    for (let index = 0; index < count; index += 1) {
      await backend.removeItem(chunkKey(key, index));
    }
  }
  await backend.removeItem(countKey(key));
}

async function readChunkCount(backend: KvBackend, key: string): Promise<number | null> {
  const raw = await backend.getItem(countKey(key));
  if (raw === null) {
    return null;
  }
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 0) {
    return null;
  }
  return count;
}

function countKey(key: string): string {
  return `${key}.count`;
}

function chunkKey(key: string, index: number): string {
  return `${key}.${index}`;
}
