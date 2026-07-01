import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { LibraryTabId } from './client-library.helpers';
import { LIBRARY_TABS, LIBRARY_TYPE_BADGE } from './client-library.helpers';
import { LIGHT } from '../../theme/light';

type Props = {
  active: LibraryTabId;
  onSelect: (id: LibraryTabId) => void;
};

export function LibraryTabBar({ active, onSelect }: Props): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {LIBRARY_TABS.map((tab) => {
        const isActive = tab.id === active;
        const badge = LIBRARY_TYPE_BADGE[tab.id];
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelect(tab.id)}
            style={[styles.tab, isActive && { backgroundColor: badge.bg, borderColor: badge.text }]}
          >
            <Text style={[styles.tabText, isActive && { color: badge.text }]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingHorizontal: 16 },
  scroll: { marginBottom: 12 },
  tab: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabText: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '600' },
});
