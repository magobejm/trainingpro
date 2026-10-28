import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@trainerpro/ui';
import type { ProgressRoutineCycle } from '@trainerpro/shared';
import { dashboardStyles as styles } from './dashboard.styles';
import { DashboardPager } from './DashboardFilters';
import { DashboardChart, routineMetrics, type DashboardMetric } from './DashboardChart';
import { DashboardDetail } from './DashboardDetail';
import { formatMetric, sessionChartPoints, sessionsForDay, type RoutineDaySession } from './dashboard-model';

const PAGE_SIZE = 12;

type Props = {
  cycleDays: number;
  cycles: ProgressRoutineCycle[];
  dayIndex: number;
  visible: boolean;
};

/** Sessions of one routine day: open one, or compare several the same way as weeks. */
export function DaySessions(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const sessions = sessionsForDay(props.cycles, props.dayIndex);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<DashboardMetric | null>(null);
  const chosen = sessions.filter((session) => selected.includes(session.id));
  const points = sessionChartPoints(chosen);
  const period = props.cycleDays === 7 ? 'week' : 'cycle';
  return (
    <View style={styles.column}>
      <View style={styles.between}>
        <Text style={styles.text}>{t('progressDashboard.daySessions')}</Text>
        <Button
          label={t('progressDashboard.compareSessions')}
          disabled={sessions.length < 2}
          onPress={() => setDraft(selected.length ? [...selected] : [])}
          variant="secondary"
          size="sm"
        />
      </View>
      {!sessions.length ? <Text style={styles.muted}>{t('progressDashboard.emptyDaySessions')}</Text> : null}
      <View style={styles.grid}>
        {sessions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((session) => (
          <SessionChip
            key={session.id}
            period={period}
            selected={(draft ?? selected).includes(session.id)}
            session={session}
            onPress={() => pressSession(session.id, draft, setDraft, setSelected)}
          />
        ))}
      </View>
      <DashboardPager page={page} count={sessions.length} size={PAGE_SIZE} onChange={setPage} />
      {draft !== null ? (
        <View style={styles.row}>
          <Button
            label={t('progressDashboard.selectAll')}
            onPress={() => setDraft(sessions.map((session) => session.id))}
            variant="secondary"
          />
          <Button
            label={t('progressDashboard.confirm')}
            disabled={!draft.length}
            onPress={() => {
              setSelected(sessions.filter((session) => draft.includes(session.id)).map((session) => session.id));
              setDraft(null);
            }}
          />
          <Button label={t('progressDashboard.cancel')} onPress={() => setDraft(null)} variant="ghost" />
        </View>
      ) : null}
      {props.visible && chosen.length ? (
        <SessionCharts
          count={chosen.length}
          detail={detail}
          points={points}
          onClose={() => {
            setSelected([]);
            setDetail(null);
          }}
          onDetail={setDetail}
        />
      ) : null}
    </View>
  );
}

function SessionChip(props: {
  onPress: () => void;
  period: 'cycle' | 'week';
  selected: boolean;
  session: RoutineDaySession;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={props.session.date}
      onPress={props.onPress}
      style={[styles.panel, styles.cycle, props.selected ? styles.selected : null]}
    >
      <Text style={styles.text}>{props.session.date}</Text>
      <Text style={styles.muted}>{t(`progressDashboard.${props.period}`, { count: props.session.cycleIndex + 1 })}</Text>
      <Text style={styles.muted}>{formatMetric(props.session.tonnage, 'kg')}</Text>
      {props.session.incomplete ? <Text style={styles.muted}>{t('progressDashboard.incomplete')}</Text> : null}
    </Pressable>
  );
}

function SessionCharts(props: {
  count: number;
  detail: DashboardMetric | null;
  onClose: () => void;
  onDetail: (metric: DashboardMetric | null) => void;
  points: ReturnType<typeof sessionChartPoints>;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.column}>
      <View style={styles.between}>
        <Text style={styles.muted}>{t('progressDashboard.selectedSessions', { count: props.count })}</Text>
        <Button label={t('progressDashboard.closeSessions')} onPress={props.onClose} variant="ghost" size="sm" />
      </View>
      <View style={styles.grid}>
        {routineMetrics.map((metric) => (
          <DashboardChart
            key={metric.key}
            connectNulls
            metric={metric}
            points={props.points}
            onDetail={() => props.onDetail(metric)}
          />
        ))}
      </View>
      {props.detail ? (
        <DashboardDetail
          connectNulls
          metric={props.detail}
          points={props.points}
          title={t('progressDashboard.daySessions')}
          onClose={() => props.onDetail(null)}
        />
      ) : null}
    </View>
  );
}

function pressSession(
  id: string,
  draft: string[] | null,
  setDraft: (ids: string[]) => void,
  setSelected: (ids: string[]) => void,
): void {
  if (draft) {
    setDraft(draft.includes(id) ? draft.filter((item) => item !== id) : [...draft, id]);
    return;
  }
  setSelected([id]);
}
