import { useRef, useState } from 'react';
import { finishCoachEditor, type CoachEditorState } from './coach-editor-state';
/** Each open gets an identity, even if the same new form/resource is reopened. */
export function useCoachEditor<T>() {
  const sequence = useRef(0);
  const [state, setState] = useState<CoachEditorState<T>>(null);
  const token = state?.token;
  const select = (value: T | null) => setState(value === null ? null : { value, token: ++sequence.current });
  const close = () => setState((current) => finishCoachEditor(current, token));
  return { value: state?.value ?? null, select, close, token };
}
