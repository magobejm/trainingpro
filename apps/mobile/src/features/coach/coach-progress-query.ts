export function coachProgressParams(clientId: string, from: string, to: string): URLSearchParams {
  return new URLSearchParams({ clientId, from, to });
}
