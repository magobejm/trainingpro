import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, type TextStyle } from 'react-native';
import { useClientMeasurementsQuery } from '../../../data/hooks/useClientsQuery';
import { measuresSubtitle } from '../measures-subtitle';

type Props = {
  clientId: string;
  style: TextStyle;
  t: (key: string, params?: Record<string, number | string>) => string;
};

/** Row subtitle: the latest weight and waist, or the empty notice when neither exists. */
export function ClientMeasuresSubtitle(props: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const query = useClientMeasurementsQuery(props.clientId);
  if (query.isLoading) return <Text style={props.style}>{props.t('coach.measures.loading')}</Text>;
  const text = measuresSubtitle(query.data ?? [], props.t, (iso) => formatSubtitleDate(iso, i18n.language));
  return <Text style={props.style}>{text ?? props.t('coach.clientProfile.details.anthropometrics.empty')}</Text>;
}

function formatSubtitleDate(iso: string, language: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  return new Date(time).toLocaleDateString(language, { day: 'numeric', month: 'short' });
}
