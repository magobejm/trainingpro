import { useEffect, useRef, useState } from 'react';
import {
  clearStoredDraft,
  isWorkDirty,
  readStoredDraft,
  rememberCreatedTemplate,
  resolveSaveTarget,
  sameWork,
  shouldOfferRecovery,
  writeStoredDraft,
  type SaveTarget,
  type StoredDraft,
} from './unsaved-work';
import { registerUnsavedGuard } from './unsaved-leave';

type Options<T> = {
  enabled?: boolean;
  onRestore: (value: T) => void;
  storageKey: string;
  value: T;
};

type Status = 'clean' | 'dirty' | 'saved' | 'saving';

export function useUnsavedWork<T>(options: Options<T>) {
  const enabled = options.enabled !== false;
  const storage = useDraftStorage(options.storageKey, options.value, options.onRestore, enabled);
  const dialogs = useLeaveDialogs(storage, enabled);
  const status = useSaveStatus(storage.isDirty, storage.saving, storage.savedTick);
  return { ...storage, ...dialogs, status };
}

function useDraftStorage<T>(storageKey: string, value: T, onRestore: (value: T) => void, enabled: boolean) {
  const baselineRef = useRef(JSON.stringify(value));
  const dirtyRef = useRef(false);
  const valueRef = useRef(value);
  const metaRef = useRef<Omit<StoredDraft<T>, 'value'>>(emptyMeta());
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const [recoverValue, setRecoverValue] = useState<T | null>(null);
  valueRef.current = value;
  const isDirty = enabled && isWorkDirty(value, JSON.parse(baselineRef.current) as T);
  dirtyRef.current = isDirty;

  useEffect(() => {
    if (!enabled) return undefined;
    const stored = readStoredDraft<T>(sessionStorage, storageKey);
    if (stored) metaRef.current = stripValue(stored);
    const baseline = JSON.parse(baselineRef.current) as T;
    const alreadyVisible = stored != null && sameWork(stored.value, valueRef.current);
    setRecoverValue(stored && !alreadyVisible && shouldOfferRecovery(stored.value, baseline) ? stored.value : null);
    return undefined;
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !isDirty) return undefined;
    writeStoredDraft(sessionStorage, storageKey, { ...metaRef.current, value });
    return undefined;
  }, [enabled, isDirty, storageKey, value, revision]);

  const bump = () => setRevision((item) => item + 1);
  return {
    adopt: (next: T, version: number | null) => {
      baselineRef.current = JSON.stringify(next);
      metaRef.current.expectedTemplateVersion = version;
      const stored = readStoredDraft<T>(sessionStorage, storageKey);
      setRecoverValue(stored && shouldOfferRecovery(stored.value, next) ? stored.value : null);
      bump();
    },
    beginSave: () => setSaving(true),
    discardRecovery: () => {
      clearStoredDraft(sessionStorage, storageKey);
      metaRef.current = emptyMeta();
      setRecoverValue(null);
    },
    endSave: () => setSaving(false),
    ensureClientSaveId: () => {
      if (!metaRef.current.clientSaveId) metaRef.current.clientSaveId = crypto.randomUUID();
      bump();
      return metaRef.current.clientSaveId;
    },
    expectedTemplateVersion: metaRef.current.expectedTemplateVersion,
    forceVersion: (version: number | null) => {
      metaRef.current.expectedTemplateVersion = version;
    },
    dirtyRef,
    isDirty,
    rememberedTemplateId: metaRef.current.rememberedTemplateId,
    rememberCreated: (created: { id: string; templateVersion?: number }, clientSaveId: string) => {
      metaRef.current = { ...metaRef.current, ...rememberCreatedTemplate(created, clientSaveId) };
      bump();
    },
    recoverValue,
    savedTick,
    release: (nextClean?: T) => {
      baselineRef.current = JSON.stringify(nextClean ?? valueRef.current);
      dirtyRef.current = false;
      clearStoredDraft(sessionStorage, storageKey);
      metaRef.current = emptyMeta();
      setSaving(false);
      setSavedTick((tick) => tick + 1);
      setRecoverValue(null);
      bump();
    },
    restoreRecovery: () => {
      if (recoverValue != null) onRestore(recoverValue);
      setRecoverValue(null);
    },
    resolveTarget: (editingId: string | null): SaveTarget =>
      resolveSaveTarget({
        clientSaveId: metaRef.current.clientSaveId,
        createId: () => {
          const id = metaRef.current.clientSaveId ?? crypto.randomUUID();
          metaRef.current.clientSaveId = id;
          return id;
        },
        editingId,
        expectedTemplateVersion: metaRef.current.expectedTemplateVersion,
        rememberedTemplateId: metaRef.current.rememberedTemplateId,
      }),
    saving,
    setExpectedTemplateVersion: (version: number | null) => {
      metaRef.current.expectedTemplateVersion = version;
    },
  };
}

function useLeaveDialogs<T>(storage: ReturnType<typeof useDraftStorage<T>>, enabled: boolean) {
  const pendingLeave = useRef<null | (() => void)>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [conflictVersion, setConflictVersion] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return undefined;
    const onUnload = (event: BeforeUnloadEvent) => {
      if (!storage.dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    registerUnsavedGuard({
      confirmLeave: (proceed) => {
        pendingLeave.current = proceed;
        setLeaveOpen(true);
      },
      isDirty: () => storage.dirtyRef.current,
    });
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      registerUnsavedGuard(null);
    };
  }, [enabled, storage.dirtyRef]);

  return {
    conflictOpen: conflictVersion !== undefined,
    conflictVersion: conflictVersion ?? null,
    dismissConflict: () => setConflictVersion(undefined),
    leaveOpen,
    reportConflict: (version: number | null) => setConflictVersion(version),
    stay: () => {
      pendingLeave.current = null;
      setLeaveOpen(false);
    },
    confirmLeave: () => {
      const proceed = pendingLeave.current;
      pendingLeave.current = null;
      setLeaveOpen(false);
      proceed?.();
    },
  };
}

function useSaveStatus(isDirty: boolean, saving: boolean, savedTick: number): Status {
  const [visibleSaved, setVisibleSaved] = useState(false);
  useEffect(() => {
    if (savedTick === 0) return undefined;
    setVisibleSaved(true);
    const timer = setTimeout(() => setVisibleSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [savedTick]);
  if (saving) return 'saving';
  if (isDirty) return 'dirty';
  if (visibleSaved) return 'saved';
  return 'clean';
}

function emptyMeta(): Omit<StoredDraft<unknown>, 'value'> {
  return { clientSaveId: null, expectedTemplateVersion: null, rememberedTemplateId: null };
}

function stripValue<T>(stored: StoredDraft<T>): Omit<StoredDraft<T>, 'value'> {
  return {
    clientSaveId: stored.clientSaveId,
    expectedTemplateVersion: stored.expectedTemplateVersion,
    rememberedTemplateId: stored.rememberedTemplateId,
  };
}

export function worksMatch(left: unknown, right: unknown): boolean {
  return sameWork(left, right);
}
