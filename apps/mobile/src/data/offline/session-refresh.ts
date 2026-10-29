export function refreshSessionAfterSave(
  queryClient: { invalidateQueries: (input: { queryKey: readonly string[] }) => Promise<unknown> },
  sessionId: string,
): void {
  void Promise.resolve()
    .then(() => queryClient.invalidateQueries({ queryKey: ['session', sessionId] }))
    .catch(() => undefined);
}
