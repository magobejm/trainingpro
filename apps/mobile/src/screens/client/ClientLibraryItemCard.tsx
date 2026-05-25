import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LibraryDisplayItem, LibraryTabId } from './client-library.helpers';
import { LIBRARY_TYPE_BADGE, getItemTypeChip } from './client-library.helpers';

type Props = {
  activeTab: LibraryTabId;
  item: LibraryDisplayItem;
  onPress: () => void;
};

export function LibraryItemCard({ item, activeTab, onPress }: Props): React.JSX.Element {
  const badge = LIBRARY_TYPE_BADGE[activeTab];
  const chip = getItemTypeChip(item);
  const muscles = item.muscleGroups?.map((mg) => mg.label).join(', ');

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.main}>
        <Text style={styles.name}>{item.name}</Text>
        {chip ? (
          <View style={[styles.chip, { backgroundColor: badge.bg }]}>
            <Text style={[styles.chipText, { color: badge.text }]}>{chip}</Text>
          </View>
        ) : null}
        {muscles ? <Text style={styles.muscles}>{muscles}</Text> : null}
      </View>
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(168,85,247,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 14,
  },
  chevron: { color: 'rgba(196,181,253,0.5)', fontSize: 18 },
  chip: { alignSelf: 'flex-start', borderRadius: 6, marginTop: 4, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  main: { flex: 1 },
  muscles: { color: 'rgba(196,181,253,0.6)', fontSize: 11, marginTop: 3 },
  name: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
