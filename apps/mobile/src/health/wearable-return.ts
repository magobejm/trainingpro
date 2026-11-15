const PROVIDERS = ['garmin', 'polar', 'strava'] as const;

export type WearableReturn = {
  provider: (typeof PROVIDERS)[number];
  status: 'error' | 'ok';
};

export function readWearableReturn(url: string): WearableReturn | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'trainerpro:' || parsed.hostname !== 'integrations') return null;
  const provider = parsed.pathname.replace(/^\//, '');
  const status = parsed.searchParams.get('status');
  if (!isProvider(provider) || (status !== 'ok' && status !== 'error')) return null;
  return { provider, status };
}

function isProvider(value: string): value is WearableReturn['provider'] {
  return (PROVIDERS as readonly string[]).includes(value);
}
