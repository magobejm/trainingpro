import { createAuthStateStorage } from './auth-storage';
import { parseGuideEntry, type GuideEntry } from './first-workout-guide.state';

const storage = createAuthStateStorage();
const tails = new Map<string, Promise<unknown>>();

export function updateStoredGuide(scope: string, update: (entry: GuideEntry) => GuideEntry): Promise<GuideEntry> {
  const previous = tails.get(scope) ?? Promise.resolve();
  const task = previous
    .catch(() => undefined)
    .then(async () => {
      const current = parseGuideEntry(await storage.getItem(scope));
      const next = update(current);
      await storage.setItem(scope, JSON.stringify(next));
      return next;
    });
  tails.set(scope, task);
  void task
    .finally(() => {
      if (tails.get(scope) === task) tails.delete(scope);
    })
    .catch(() => undefined);
  return task;
}
