import { createAuthStateStorage } from './auth-storage';
const storage = createAuthStateStorage();
const registryKey = 'tp.coach.draft-index';
let writes: Promise<unknown> = Promise.resolve();
let generation = 0;
export function draftGeneration() {
  return generation;
}
function serialize<T>(task: () => Promise<T>) {
  const pending = writes.catch(() => undefined).then(task);
  writes = pending;
  return pending;
}
export async function readCoachDraft(key: string) {
  await writes.catch(() => undefined);
  return storage.getItem(key);
}
async function readRegistry(): Promise<string[]> {
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(registryKey)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}
export function saveCoachDraft(key: string, value: string, expectedGeneration: number, expectedValue?: string | null) {
  return serialize(async () => {
    if (generation !== expectedGeneration) return;
    if (expectedValue !== undefined && (await storage.getItem(key)) !== expectedValue)
      throw new Error('Draft changed in another editor');
    const keys = await readRegistry();
    if (!keys.includes(key)) await storage.setItem(registryKey, JSON.stringify([...keys, key]));
    await storage.setItem(key, value);
  });
}
export function removeCoachDraft(key: string, expectedValue?: string, expectedGeneration?: number) {
  return serialize(async () => {
    if (expectedGeneration !== undefined && generation !== expectedGeneration) return false;
    const current = await storage.getItem(key);
    if (expectedValue !== undefined && current !== null && current !== expectedValue) return false;
    await storage.removeItem(key);
    return true;
  });
}
export function clearCoachDrafts() {
  generation += 1;
  return serialize(async () => {
    const keys = await readRegistry();
    await Promise.all(keys.map((key) => storage.removeItem(key)));
    await storage.removeItem(registryKey);
  });
}
