import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useIncidentsListQuery, type IncidentListItem } from '../../data/hooks/useIncidents';
import { IncidentCreatePanel } from './IncidentCreateScreen';

type Tab = 'history' | 'new';

type IncidentsScreenProps = {
  onClose: () => void;
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  LOW: '#22c55e',
  MEDIUM: '#eab308',
};

const BG = '#07000f';
const CARD = 'rgba(0,0,0,0.55)';
const TEXT = '#ffffff';
const MUTED = 'rgba(196,181,253,0.7)';
const ACCENT = '#ec4899';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.tabBar}>
      <Pressable onPress={() => onChange('history')} style={[styles.tab, active === 'history' && styles.tabActive]}>
        <Text style={[styles.tabText, active === 'history' && styles.tabTextActive]}>
          {t('client.incidents.tabHistory')}
        </Text>
      </Pressable>
      <Pressable onPress={() => onChange('new')} style={[styles.tab, active === 'new' && styles.tabActive]}>
        <Text style={[styles.tabText, active === 'new' && styles.tabTextActive]}>{t('client.incidents.tabNew')}</Text>
      </Pressable>
    </View>
  );
}

function IncidentRow({ item }: { item: IncidentListItem }) {
  const { t } = useTranslation();
  const color = SEVERITY_COLOR[item.severity] ?? '#94a3b8';
  const date = new Date(item.createdAt).toLocaleDateString();
  const statusLabel = t(`client.incidents.status.${item.status.toLowerCase()}`);
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
        <Text style={styles.rowDate}>{date}</Text>
        <Text style={styles.rowStatus}>{statusLabel}</Text>
      </View>
      <Text style={styles.rowDesc} numberOfLines={3}>
        {item.description}
      </Text>
    </View>
  );
}

function HistoryTab() {
  const { t } = useTranslation();
  const query = useIncidentsListQuery();
  const items = query.data ?? [];

  if (query.isPending) {
    return <Text style={styles.empty}>{'...'}</Text>;
  }
  if (items.length === 0) {
    return <Text style={styles.empty}>{t('client.incidents.empty')}</Text>;
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <IncidentRow item={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

export function IncidentsScreen({ onClose }: IncidentsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('history');
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('client.incidents.title')}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{'✕'}</Text>
        </Pressable>
      </View>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'history' ? <HistoryTab /> : <IncidentCreatePanel onCreated={() => setTab('history')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: MUTED,
    fontSize: 18,
  },
  container: {
    backgroundColor: BG,
    flex: 1,
  },
  empty: {
    color: MUTED,
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  list: {
    gap: 8,
    padding: 16,
  },
  row: {
    backgroundColor: CARD,
    borderRadius: 12,
    gap: 6,
    padding: 12,
  },
  rowDate: {
    color: MUTED,
    fontSize: 12,
    flex: 1,
  },
  rowDesc: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 18,
  },
  rowStatus: {
    color: MUTED,
    fontSize: 12,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    borderBottomColor: ACCENT,
  },
  tabBar: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: TEXT,
  },
  title: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
  },
});
