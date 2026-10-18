import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';
import { compareRoutineContent } from '@trainerpro/shared';
import { useRoutineAssignmentDetailQuery, useRoutineAssignmentsQuery } from '../../data/hooks/useRoutineAssignments';
import { useFormatDate } from '../../i18n/useFormatDate';
import { RoutineComparisonPanel } from './RoutineComparisonPanel';

export function RoutineAssignmentHistory({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <Button variant="secondary" label={t('routineVersions.history')} onPress={() => setOpen(true)} />
      {open ? <HistoryDialog key={clientId} clientId={clientId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HistoryDialog({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const format = useFormatDate();
  const [selected, setSelected] = useState<string | null>(null);
  const history = useRoutineAssignmentsQuery(clientId, true);
  const detail = useRoutineAssignmentDetailQuery(clientId, selected);
  return (
    <Modal
      visible
      closeLabel={t('routineVersions.close')}
      title={t('routineVersions.history')}
      onClose={onClose}
      footer={<Button label={t('routineVersions.close')} onPress={onClose} />}
    >
      <View style={styles.content}>
        {history.isLoading ? <Text style={styles.text}>{t('routineVersions.loading')}</Text> : null}
        {history.isError ? (
          <View>
            <Text style={styles.text}>{t('routineVersions.error')}</Text>
            <Button label={t('routineVersions.retry')} onPress={() => void history.refetch()} />
          </View>
        ) : null}
        {history.data?.pages
          .flatMap((page) => page.items)
          .map((assignment) => (
            <View key={assignment.id} style={styles.row}>
              <Text
                style={styles.heading}
              >{`${assignment.name} · v${assignment.version} ${assignment.active ? `· ${t('routineVersions.current')}` : ''}`}</Text>
              <Text style={styles.text}>{format(assignment.appliedAt)}</Text>
              {assignment.initial ? <Text style={styles.text}>{t('routineVersions.initial')}</Text> : null}
              <Button
                variant="secondary"
                selected={selected === assignment.id}
                label={t('routineVersions.view')}
                onPress={() => setSelected(selected === assignment.id ? null : assignment.id)}
              />
              {selected === assignment.id ? (
                <View style={styles.content}>
                  {detail.isLoading ? <Text style={styles.text}>{t('routineVersions.loading')}</Text> : null}
                  {detail.isError ? (
                    <Button label={t('routineVersions.retry')} onPress={() => void detail.refetch()} />
                  ) : null}
                  {detail.data ? (
                    <>
                      <Text style={styles.heading}>{t('routineVersions.savedContent')}</Text>
                      <RoutineComparisonPanel comparison={compareRoutineContent(null, detail.data.content)} t={t} />
                      <Text style={styles.heading}>{t('routineVersions.comparedToCurrent')}</Text>
                      <RoutineComparisonPanel comparison={detail.data.comparison} t={t} />
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
        {history.data?.pages[0]?.items.length === 0 ? <Text style={styles.text}>{t('routineVersions.empty')}</Text> : null}
        {history.hasNextPage ? (
          <Button
            label={t('routineVersions.more')}
            loading={history.isFetchingNextPage}
            onPress={() => void history.fetchNextPage()}
          />
        ) : null}
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  content: { gap: space.md },
  row: { gap: space.sm, paddingVertical: space.md, borderBottomWidth: 1, borderColor: colors.border },
  heading: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  text: { color: colors.text, fontSize: fontSize.sm },
});
