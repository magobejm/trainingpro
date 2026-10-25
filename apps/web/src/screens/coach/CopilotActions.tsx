import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

type Translate = (key: string, options?: Record<string, unknown>) => string;
export const COPILOT_ROUTINE = '/copilot/routine-draft';
export const COPILOT_MENU = '/copilot/nutrition-draft';
export const COPILOT_SUMMARY = '/copilot/weekly-summary';

export function CopilotButton(props: {
  body: Record<string, unknown>;
  label: string;
  onResult?: (value: unknown) => void;
  path: string;
  t: Translate;
}): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState('');
  const accessToken = useAuthStore((state) => state.accessToken);
  const run = async () => {
    setFailed(false);
    setNote('');
    try {
      const result = await createApiClient({ accessToken: accessToken ?? '', activeRole: 'coach' }).post<unknown>(
        props.path,
        props.body,
      );
      props.onResult?.(result);
      setNote(readNote(result));
    } catch {
      setFailed(true);
    }
  };
  return (
    <View style={{ gap: space.xs, marginVertical: space.sm }}>
      <Button label={props.label} onPress={() => void run()} variant="secondary" />
      {failed ? <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>{props.t('coach.copilot.retry')}</Text> : null}
      {note ? <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{note}</Text> : null}
    </View>
  );
}

function readNote(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const body = value as { headline?: string; note?: string; name?: string };
  return body.headline || body.note || body.name || '';
}
