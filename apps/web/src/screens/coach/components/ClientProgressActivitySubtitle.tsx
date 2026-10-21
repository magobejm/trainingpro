import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRecentSessionsQuery } from '../../../data/hooks/useRecentSessionsQuery';

type Props = {
  clientId: string;
  style: StyleProp<TextStyle>;
  t: (key: string, options?: Record<string, number | string>) => string;
};

export function ClientProgressActivitySubtitle({ clientId, style, t }: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const range = lastFourWeeks(new Date());
  const query = useRecentSessionsQuery({ clientId, from: range.from, to: range.to, all: true, limit: 200 });

  if (query.isLoading) {
    return <Text style={style}>{t('coach.clientProfile.details.progress.loading')}</Text>;
  }
  if (query.isError) {
    return <Text style={style}>{t('coach.clientProfile.details.progress.error')}</Text>;
  }

  const sessions = (query.data ?? []).filter(hasRecordedActivity);
  if (!sessions.length) {
    return <Text style={style}>{t('coach.clientProfile.details.progress.noRecentActivity')}</Text>;
  }

  const latestDate = sessions.reduce(
    (latest, session) => (session.sessionDate > latest ? session.sessionDate : latest),
    sessions[0]!.sessionDate,
  );
  return (
    <Text style={style}>
      {t('coach.clientProfile.details.progress.recentActivity', {
        count: sessions.length,
        date: formatSessionDate(latestDate, i18n.language),
      })}
    </Text>
  );
}

function hasRecordedActivity(session: { outcome?: string; hasRecordedData?: boolean }): boolean {
  if (session.hasRecordedData !== true) return false;
  return session.outcome == null || session.outcome === 'done' || session.outcome === 'incomplete';
}

function lastFourWeeks(today: Date): { from: string; to: string } {
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  from.setDate(from.getDate() - 27);
  return { from: localDateKey(from), to: localDateKey(today) };
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatSessionDate(value: string, language: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}
