/** The signer rounds expiry to a time window; renew just after that window ends. */
export function brandingRefreshInterval(url: string | null | undefined, now = Date.now()): number {
  const maximum = 15 * 60_000;
  if (!url) return maximum;
  try {
    const expiry = Number(new URL(url).searchParams.get('exp')) * 1000;
    return Number.isFinite(expiry) && expiry > 0 ? Math.max(1000, Math.min(maximum, expiry - now + 1000)) : maximum;
  } catch {
    return maximum;
  }
}
