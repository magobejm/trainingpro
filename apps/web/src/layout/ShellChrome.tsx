import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dumbbell } from 'lucide-react';

export function SidebarIdentity(props: { roleLabel: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.identityCard}>
      <View style={styles.avatarStub}>
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Dumbbell color="#ffffff" size={24} />
      </View>
      <View style={styles.identityTextWrap}>
        <Text style={styles.logo}>{props.title}</Text>
        <Text style={styles.logoSubtitle}>{props.roleLabel}</Text>
      </View>
    </View>
  );
}

export function TopBar(props: { roleLabel: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.topbar}>
      <View>
        <Text style={styles.topbarTitle}>{props.title}</Text>
        <Text style={styles.topbarSubtitle}>{props.roleLabel}</Text>
      </View>
      <View style={styles.topbarRight}>
        <View style={styles.topbarIconButton} />
        <View style={styles.topbarIconButton} />
        <View style={styles.topbarStatus}>
          <View style={styles.onlineDot} />
          <Text style={styles.topbarStatusLabel}>{props.roleLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarStub: {
    alignItems: 'center',
    backgroundColor: '#0066ff', // Bright blue from prototype
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  identityCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  identityTextWrap: {
    flex: 1,
  },
  logo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: -1,
    textTransform: 'uppercase',
  },
  onlineDot: {
    backgroundColor: '#23b26d',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  topbar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe2ec',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  topbarIconButton: {
    backgroundColor: '#f1f4f9',
    borderColor: '#dbe2ec',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  topbarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  topbarStatus: {
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderColor: '#d6e4ff',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topbarStatusLabel: {
    color: '#214c9f',
    fontSize: 12,
    fontWeight: '700',
  },
  topbarSubtitle: {
    color: '#6a7381',
    fontSize: 12,
    fontWeight: '600',
  },
  topbarTitle: {
    color: '#111418',
    fontSize: 18,
    fontWeight: '800',
  },
});
