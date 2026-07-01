import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useClientLibraryCardioQuery,
  useClientLibraryExercisesQuery,
  useClientLibraryIsometricQuery,
  useClientLibraryMobilityQuery,
  useClientLibraryPlioQuery,
  useClientLibrarySportsQuery,
} from '../../data/hooks/useClientLibrary';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import type { LibraryDisplayItem, LibraryTabId } from './client-library.helpers';
import { LibraryItemCard } from './ClientLibraryItemCard';
import { LibraryItemDetail } from './ClientLibraryItemDetail';
import { LibrarySearchBar } from './ClientLibrarySearchBar';
import { LibraryTabBar } from './ClientLibraryTabs';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = { onClose: () => void };

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;

function useLibraryTabData(activeTab: LibraryTabId, q: string) {
  const exercises = useClientLibraryExercisesQuery(q, activeTab === 'strength');
  const cardio = useClientLibraryCardioQuery(q, activeTab === 'cardio');
  const plio = useClientLibraryPlioQuery(q, activeTab === 'plio');
  const mobility = useClientLibraryMobilityQuery(q, activeTab === 'mobility');
  const isometric = useClientLibraryIsometricQuery(q, activeTab === 'isometric');
  const sports = useClientLibrarySportsQuery(q, activeTab === 'sport');
  const map: Record<LibraryTabId, { data?: unknown[]; isLoading: boolean }> = {
    cardio,
    isometric,
    mobility,
    plio,
    sport: sports,
    strength: exercises,
  };
  return map[activeTab];
}

export function ClientLibraryScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LibraryTabId>('strength');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<LibraryDisplayItem | null>(null);

  const { data, isLoading } = useLibraryTabData(activeTab, search);
  const items = (data ?? []) as LibraryDisplayItem[];

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.library.title')} />
      <LibrarySearchBar onChange={setSearch} value={search} />
      <LibraryTabBar active={activeTab} onSelect={setActiveTab} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{search ? t('client.library.noResults') : t('client.library.empty')}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LibraryItemCard activeTab={activeTab} item={item} onPress={() => setSelectedItem(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <LibraryItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: SCREEN.root,
  emptyText: { color: LIGHT.textMuted, fontSize: 14 },
  list: { paddingBottom: 32 },
});
