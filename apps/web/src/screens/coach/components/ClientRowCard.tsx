import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  accent: '#1c74e9',
  border: '#dfe8f5',
  text: '#111418',
  textMuted: '#6a7381',
};

type Props = {
  avatarUrl: null | string;
  email: string;
  id: string;
  name: string;
  onSelect: (clientId: string) => void;
  selected: boolean;
};

export function ClientRowCard(props: Props): React.JSX.Element {
  return (
    <Pressable
      onPress={() => props.onSelect(props.id)}
      style={[styles.row, props.selected ? styles.rowSelected : null]}
    >
      <View style={styles.avatarWrap}>
        <AvatarBadge label={props.name} url={props.avatarUrl} />
      </View>
      <View style={styles.textWrap}>
        <Text numberOfLines={2} style={styles.rowTitle}>{props.name}</Text>
        <Text numberOfLines={2} style={styles.rowSubtitle}>{props.email}</Text>
      </View>
    </Pressable>
  );
}

function AvatarBadge(props: { label: string; url: null | string }): React.JSX.Element {
  if (props.url) {
    return <Image source={{ uri: props.url }} style={styles.avatarImage} />;
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarLabel}>{readInitials(props.label)}</Text>
    </View>
  );
}

function readInitials(name: string): string {
  const [a = 'C', b = 'L'] = name
    .split(' ')
    .filter((item) => item.length > 0)
    .map((item) => item[0]?.toUpperCase() ?? '');
  return `${a}${b}`;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#eaf2ff',
    borderRadius: 999,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  avatarImage: {
    borderRadius: 999,
    height: 92,
    objectFit: 'cover',
    width: 92,
  },
  avatarLabel: {
    color: '#225fdb',
    fontSize: 24,
    fontWeight: '800',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#fbfcff',
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 236,
    minWidth: 228,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  rowIdentity: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: 10,
    marginTop: 14,
  },
  rowSelected: {
    backgroundColor: '#f4f8ff',
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  rowSubtitle: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
});
