/** Solo se abren o reproducen enlaces http o https; el resto (javascript:, data:, file:) se descarta. */
export function isHttpUrl(value: null | string | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
