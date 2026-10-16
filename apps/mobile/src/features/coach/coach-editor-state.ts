export type CoachEditorState<T> = { token: number; value: T } | null;
export function finishCoachEditor<T>(state: CoachEditorState<T>, token: number | undefined): CoachEditorState<T> {
  return state?.token === token ? null : state;
}
