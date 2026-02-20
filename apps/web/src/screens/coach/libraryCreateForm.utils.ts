import React from 'react';

export function createFieldSetter<TState extends Record<string, string>>(
  setForm: React.Dispatch<React.SetStateAction<TState>>,
) {
  return (field: string) => (value: string) =>
    setForm((current) => ({ ...current, [field as keyof TState]: value }));
}

export function normalizeNullable(value: string): null | string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}
