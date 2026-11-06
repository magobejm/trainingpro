import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';
import { backdropStyle, drawerStyle } from './components/ClientProfileSectionsBoard.styles';
import { useClientWearables } from './use-client-wearables';
import { WearableDayLines } from './WearableDayLines';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ClientExternalDrawer(props: {
  clientId: string;
  onClose: () => void;
  t: Translate;
  visible: boolean;
}): React.JSX.Element | null {
  const query = useClientWearables(props.clientId);
  if (!props.visible) return null;
  const metrics = query.data?.metrics ?? [];
  return (
    <>
      <div style={drawerStyle(true)}>
        <View style={header}>
          <Text style={title}>{props.t('coach.clientProfile.details.external.title')}</Text>
          <Pressable accessibilityRole="button" onPress={props.onClose}>
            <Text style={close}>{props.t('coach.wearables.close')}</Text>
          </Pressable>
        </View>
        {metrics.length === 0 ? <Text style={muted}>{props.t('coach.wearables.empty')}</Text> : null}
        {metrics.map((metric) => (
          <WearableDayLines key={`${metric.date}-${metric.source}`} metric={metric} t={props.t} />
        ))}
      </div>
      <div onClick={props.onClose} style={backdropStyle} />
    </>
  );
}

const header = { alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'space-between' as const };
const title = { color: colors.text, fontSize: fontSize.md };
const close = { color: colors.primary, fontSize: fontSize.sm };
const muted = { color: colors.textMuted, fontSize: fontSize.sm, marginTop: space.sm };
