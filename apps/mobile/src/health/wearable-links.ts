export const CLOUD_PROVIDERS = ['garmin', 'polar', 'strava'] as const;

export type CloudProvider = (typeof CLOUD_PROVIDERS)[number];

export type SavedConnection = {
  provider: string;
  status: string;
};

export function linkedCloudProviders(rows: SavedConnection[]): ReadonlySet<CloudProvider> {
  const linked = new Set<CloudProvider>();
  for (const row of rows) {
    const provider = row.provider.toLowerCase();
    if (row.status === 'CONNECTED' && isCloudProvider(provider)) linked.add(provider);
  }
  return linked;
}

function isCloudProvider(value: string): value is CloudProvider {
  return (CLOUD_PROVIDERS as readonly string[]).includes(value);
}
