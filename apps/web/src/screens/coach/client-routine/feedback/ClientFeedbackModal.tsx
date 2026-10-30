import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, FilterChips, Modal, SegmentedControl, colors, fontSize, radius, space } from '@trainerpro/ui';
import { filterFeedback, splitByAge, type FeedbackScope, type RoutineEditorWeek } from '@trainerpro/shared';
import '../../../../i18n';
import { useClientFeedback } from '../../../../data/hooks/useClientFeedback';
import { LoadingState } from '../../../../components/AsyncStatus';
import { FeedbackLists } from './FeedbackLists';

const ALL_WEEKS = 'all';

/** What the client wrote, read-only. Shows exercises first and keeps anything over four months in a drawer. */
export function ClientFeedbackModal(props: {
  clientId: string;
  onClose: () => void;
  weeks: RoutineEditorWeek[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const feedback = useClientFeedback(props.clientId, true);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<FeedbackScope>('EXERCISE');
  const [weekId, setWeekId] = useState(ALL_WEEKS);
  const [drawer, setDrawer] = useState(false);
  const week = props.weeks.find((item) => item.id === weekId) ?? null;
  const view = useMemo(() => {
    const filter = { from: week?.startsOn ?? null, query, scope, to: week?.endsOn ?? null };
    const now = new Date();
    return {
      incidents: splitByAge(
        filterFeedback(feedback.incidents, filter, (item) => `${item.description} ${item.tag ?? ''}`),
        now,
      ),
      notes: splitByAge(
        filterFeedback(feedback.notes, filter, (item) => `${item.text} ${item.exerciseName ?? ''}`),
        now,
      ),
    };
  }, [feedback.incidents, feedback.notes, query, scope, week]);
  const olderCount = view.incidents.older.length + view.notes.older.length;
  const weekItems = [
    { id: ALL_WEEKS, label: t('coach.clientFeedback.allWeeks') },
    ...props.weeks.map((item) => ({ id: item.id, label: t('coach.clientRoutine.week', { n: item.weekIndex }) })),
  ];
  return (
    <Modal closeLabel={t('common.close')} onClose={props.onClose} size="xl" title={t('coach.clientFeedback.title')} visible>
      <View style={styles.stack}>
        <View style={styles.filters}>
          <TextInput
            accessibilityLabel={t('coach.clientFeedback.search')}
            onChangeText={setQuery}
            placeholder={t('coach.clientFeedback.search')}
            style={styles.search}
            value={query}
          />
          <SegmentedControl
            onChange={(value) => setScope(value as FeedbackScope)}
            options={[
              { label: t('coach.clientFeedback.category.EXERCISE'), value: 'EXERCISE' },
              { label: t('coach.clientFeedback.scopeAll'), value: 'ALL' },
            ]}
            value={scope}
          />
        </View>
        <FilterChips activeId={weekId} items={weekItems} onSelect={setWeekId} />
        {feedback.isLoading ? <LoadingState label={t('coach.clientFeedback.loading')} /> : null}
        {feedback.isError ? <Text style={styles.empty}>{t('coach.clientFeedback.error')}</Text> : null}
        <FeedbackLists incidents={view.incidents.recent} notes={view.notes.recent} t={t} />
        {olderCount > 0 ? (
          <Button
            label={t('coach.clientFeedback.olderOpen', { count: olderCount, months: 4 })}
            onPress={() => setDrawer(true)}
            variant="secondary"
          />
        ) : null}
      </View>
      {drawer ? (
        <Modal
          closeLabel={t('common.close')}
          onClose={() => setDrawer(false)}
          size="xl"
          title={t('coach.clientFeedback.olderTitle', { months: 4 })}
          visible
        >
          <FeedbackLists incidents={view.incidents.older} notes={view.notes.older} t={t} />
        </Modal>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  filters: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: fontSize.sm,
    minWidth: 220,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  stack: { gap: space.lg },
});
