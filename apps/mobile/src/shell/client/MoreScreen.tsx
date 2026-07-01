import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { showComingSoon } from './feedback';
import { s } from './client-shell.styles';
import type { MoreMenuId } from './client-shell.constants';

type MoreScreenProps = {
  onNavigate: (id: MoreMenuId) => void;
};

const MORE_ITEMS: { emoji: string; id: MoreMenuId; labelKey: string }[] = [
  { emoji: '⚠️', id: 'incidents', labelKey: 'mobile.client.more.incidents' },
  { emoji: '📝', id: 'notes', labelKey: 'mobile.client.more.notes' },
  { emoji: '📐', id: 'measures', labelKey: 'mobile.client.more.measures' },
  { emoji: '📋', id: 'planning', labelKey: 'mobile.client.more.planning' },
  { emoji: '📊', id: 'volume', labelKey: 'mobile.client.more.volume' },
];

export function MoreScreen(props: MoreScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={s.moreHeader}>
        <Text style={s.moreHeaderTitle}>{t('mobile.client.more.title')}</Text>
        <Text style={s.moreHeaderSub}>{t('mobile.client.more.subtitle')}</Text>
      </View>
      <View style={s.moreList}>
        {MORE_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.id === 'notes') {
                showComingSoon(t('mobile.client.more.notes'));
                return;
              }
              props.onNavigate(item.id);
            }}
            style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
          >
            <View style={s.moreItemLeft}>
              <View style={s.moreItemIcon}>
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              </View>
              <Text style={s.moreItemLabel}>{t(item.labelKey)}</Text>
            </View>
            <Text style={{ color: '#93c5fd', fontSize: 18 }}>{'›'}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
