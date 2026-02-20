import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '../supabase-client';
import { resolveDefaultAvatarUrl } from '../avatar-default';

type Settings = {
  avatarUrl: null | string;
  email: string;
  firstName: string;
  lastName: string;
};

const STORAGE_PREFIX = 'trainerpro.web.user-settings';
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

export function useUserSettings(email: string) {
  const [settings, setSettings] = useState<Settings>(() => readSettings(email));
  useEffect(() => {
    setSettings((prev) => hydrateEmail(prev, email));
  }, [email]);
  const displayName = useMemo(() => buildDisplayName(settings), [settings]);
  const avatarUrl = settings.avatarUrl ?? resolveDefaultAvatarUrl(settings.email || displayName);
  const saveSettings = async (next: Settings) => {
    await updateEmailIfNeeded(settings.email, next.email);
    setSettings(persistSettings(next));
  };
  return { avatarUrl, displayName, saveSettings, settings };
}

function hydrateEmail(settings: Settings, email: string): Settings {
  if (!email) {
    return emptySettings('');
  }
  if (settings.email === email) {
    return settings;
  }
  return readSettings(email);
}

function updateEmailIfNeeded(currentEmail: string, nextEmail: string): Promise<void> | void {
  if (!nextEmail || currentEmail === nextEmail) {
    return;
  }
  const supabase = createSupabaseClient();
  return supabase.auth.updateUser({ email: nextEmail }).then(({ error }) => {
    if (error) {
      throw new Error(error.message);
    }
  });
}

function buildDisplayName(settings: Settings): string {
  const first = settings.firstName.trim();
  const last = settings.lastName.trim();
  const full = `${first} ${last}`.trim();
  if (full.length > 0) {
    return full;
  }
  return settings.email;
}

function readSettings(email: string): Settings {
  const defaults = emptySettings(email);
  if (!email) {
    return defaults;
  }
  const storageKey = resolveStorageKey(email);
  const raw = readStorage(storageKey);
  if (raw) {
    return parseSettings(raw, defaults);
  }
  const legacyRaw = readStorage(LEGACY_STORAGE_KEY);
  if (!legacyRaw) {
    return defaults;
  }
  const legacyParsed = parseSettings(legacyRaw, defaults);
  if (legacyParsed.email !== email) {
    return defaults;
  }
  return persistSettings(legacyParsed);
}

function emptySettings(email: string): Settings {
  return { avatarUrl: null, email, firstName: '', lastName: '' };
}

function parseSettings(raw: string, defaults: Settings): Settings {
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      avatarUrl: parsed.avatarUrl ?? null,
      email: parsed.email ?? defaults.email,
      firstName: parsed.firstName ?? '',
      lastName: parsed.lastName ?? '',
    };
  } catch {
    return defaults;
  }
}

function resolveStorageKey(email: string): string {
  return `${STORAGE_PREFIX}:${email.trim().toLowerCase()}`;
}

function persistSettings(settings: Settings): Settings {
  const key = settings.email ? resolveStorageKey(settings.email) : LEGACY_STORAGE_KEY;
  writeStorage(key, JSON.stringify(settings));
  return settings;
}

function readStorage(key: string): null | string {
  const scope = globalThis as { localStorage?: Storage };
  return scope.localStorage?.getItem(key) ?? null;
}

function writeStorage(key: string, value: string): void {
  const scope = globalThis as { localStorage?: Storage };
  scope.localStorage?.setItem(key, value);
}
