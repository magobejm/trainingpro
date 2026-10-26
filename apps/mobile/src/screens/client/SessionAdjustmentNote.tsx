import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIncidentsListQuery } from '../../data/hooks/useIncidents';
import { LIGHT } from '../../theme/light';

/** Muestra el ajuste que el coach dejó en una incidencia, para tenerlo a mano al empezar la sesión. */
export function SessionAdjustmentNote(): React.JSX.Element | null {
  const { t } = useTranslation();
  const query = useIncidentsListQuery();
  const note = (query.data ?? []).find((item) => item.adjustmentDraft)?.adjustmentDraft;
  if (!note) return null;
  return (
    <View
      style={{
        backgroundColor: LIGHT.accentSoft,
        borderRadius: LIGHT.radiusMd,
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
      }}
    >
      <Text style={{ color: LIGHT.accentDark, fontSize: 12, fontWeight: '800' }}>{t('client.incidents.adjustment')}</Text>
      <Text style={{ color: LIGHT.textStrong, fontSize: 14 }}>{note}</Text>
    </View>
  );
}
