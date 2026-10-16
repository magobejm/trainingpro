import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { CoachButton } from './CoachUi';
import { coachDocumentHtml, type CoachDocumentSection } from './coach-document';
export function CoachPdfButton({ title, sections }: { title: string; sections: CoachDocumentSection[] }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();
  const print = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const printer = await import('expo-print');
      const html = coachDocumentHtml(title, sections);
      if (Platform.OS === 'web') {
        await printer.printAsync({ html });
      } else {
        const file = await printer.printToFileAsync({ html, base64: false });
        const sharing = await import('expo-sharing');
        if (await sharing.isAvailableAsync())
          await sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
        else await printer.printAsync({ uri: file.uri });
      }
      toast.success(t('coachWorkspace.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('coachWorkspace.saveError'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <CoachButton
      label={t('coachWorkspace.exportPdf', { defaultValue: 'PDF' })}
      onPress={() => void print()}
      loading={busy}
    />
  );
}
