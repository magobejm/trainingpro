export type HealthAccess = 'unavailable' | 'denied' | 'connected';

export const HEALTH_ACCESS_LABEL: Record<HealthAccess, string> = {
  connected: 'mobile.client.health.connected',
  denied: 'mobile.client.health.denied',
  unavailable: 'mobile.client.health.unavailable',
};

/** The OS grant list is the only signal that Health Connect is actually connected. */
export function healthAccessFromGrants(sdkReady: boolean, grantedCount: number): HealthAccess {
  if (!sdkReady) return 'unavailable';
  return grantedCount > 0 ? 'connected' : 'denied';
}
