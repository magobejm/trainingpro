import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import type { PdfDocument } from './pdf-model';

export function PdfDownloadButton(props: {
  document: () => PdfDocument | Promise<PdfDocument>;
  disabled?: boolean;
  label: string;
  busyLabel: string;
  errorMessage: string;
}): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function download() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      // Capture editor data before waiting for the deferred PDF bundle.
      const snapshot = await props.document();
      const { downloadPdf } = await import('./export-pdf');
      await downloadPdf(snapshot);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: space.xs, alignItems: 'flex-start' }}>
      <Button
        label={busy ? props.busyLabel : props.label}
        disabled={props.disabled || busy}
        onPress={() => void download()}
        variant="secondary"
        size="sm"
      />
      {failed ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: fontSize.sm }}>
          {props.errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
