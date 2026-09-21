/* eslint-disable max-lines */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useClientPhysicalTestsQuery,
  useRecordPhysicalTestResultMutation,
  type ClientPhysicalTestAssignment,
  type PhysicalTestResultView,
  type RecordPhysicalTestInput,
} from '../../data/hooks/usePhysicalTests';
import { useClientMeQuery } from '../../data/hooks/useClientMeQuery';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { LIGHT } from '../../theme/light';
import { SCREEN, SESSION } from '../../theme/sessionStyles';

type Props = { onClose: () => void };
type Tab = 'catalog' | 'history';

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;
const MODAL_ANIMATION = 'slide' as const;
const KEYBOARD_DECIMAL_PAD = 'decimal-pad' as const;
const KEYBOARD_NUMBER_PAD = 'number-pad' as const;

type CategoryGroup = {
  category: string;
  tests: ClientPhysicalTestAssignment[];
};

export function PhysicalTestsScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientPhysicalTestsQuery();
  const [tab, setTab] = useState<Tab>('catalog');
  const [selected, setSelected] = useState<ClientPhysicalTestAssignment | null>(null);
  const [recording, setRecording] = useState<ClientPhysicalTestAssignment | null>(null);

  const grouped = useMemo(() => groupByCategory(query.data ?? []), [query.data]);
  const history = useMemo(() => flattenHistory(query.data ?? []), [query.data]);

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.physicalTests.title')} />
      <TabBar active={tab} onChange={setTab} t={t} />
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t('client.physicalTests.error')}</Text>
        </View>
      ) : tab === 'catalog' ? (
        <CatalogTab groups={grouped} onSelect={setSelected} t={t} />
      ) : (
        <HistoryTab items={history} t={t} />
      )}
      <DetailModal
        assignment={selected}
        onClose={() => setSelected(null)}
        onRecord={() => {
          if (selected) {
            setRecording(selected);
            setSelected(null);
          }
        }}
        t={t}
      />
      <RecordModal assignment={recording} onClose={() => setRecording(null)} t={t} />
    </View>
  );
}

function TabBar({
  active,
  onChange,
  t,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      <Pressable onPress={() => onChange('catalog')} style={[styles.tab, active === 'catalog' && styles.tabActive]}>
        <Text style={[styles.tabText, active === 'catalog' && styles.tabTextActive]}>
          {t('client.physicalTests.tabCatalog')}
        </Text>
      </Pressable>
      <Pressable onPress={() => onChange('history')} style={[styles.tab, active === 'history' && styles.tabActive]}>
        <Text style={[styles.tabText, active === 'history' && styles.tabTextActive]}>
          {t('client.physicalTests.tabHistory')}
        </Text>
      </Pressable>
    </View>
  );
}

function CatalogTab({
  groups,
  onSelect,
  t,
}: {
  groups: CategoryGroup[];
  onSelect: (item: ClientPhysicalTestAssignment) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  if (groups.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('client.physicalTests.empty')}</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {groups.map((group) => (
        <View key={group.category} style={styles.categorySection}>
          <Text style={styles.categoryLabel}>{group.category}</Text>
          {group.tests.map((assignment) => (
            <Pressable
              key={assignment.id}
              onPress={() => onSelect(assignment)}
              style={({ pressed }) => [styles.testCard, pressed && { opacity: 0.92 }]}
            >
              <View style={styles.testCardTop}>
                <Text style={styles.testName}>{assignment.physicalTest.name}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{assignment.physicalTest.level}</Text>
                </View>
              </View>
              {assignment.latestResult ? (
                <View style={styles.resultRow}>
                  <Text style={styles.resultScore}>{assignment.latestResult.rawScore}</Text>
                  <Text style={styles.resultClass}>{assignment.latestResult.classification}</Text>
                </View>
              ) : (
                <Text style={styles.noResult}>{t('client.physicalTests.noResult')}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function HistoryTab({
  items,
  t,
}: {
  items: Array<{ assignment: ClientPhysicalTestAssignment; result: PhysicalTestResultView }>;
  t: (key: string) => string;
}): React.JSX.Element {
  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('client.physicalTests.historyEmpty')}</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {items.map(({ assignment, result }) => (
        <View key={result.id} style={styles.historyCard}>
          <View style={styles.historyTop}>
            <Text style={styles.historyName}>{assignment.physicalTest.name}</Text>
            <Text style={styles.historyDate}>{formatDate(result.measuredAt)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultScore}>{result.rawScore}</Text>
            <Text style={styles.resultClass}>{result.classification}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function DetailModal({
  assignment,
  onClose,
  onRecord,
  t,
}: {
  assignment: ClientPhysicalTestAssignment | null;
  onClose: () => void;
  onRecord: () => void;
  t: (key: string) => string;
}): React.JSX.Element {
  if (!assignment) return <></>;
  const test = assignment.physicalTest;
  return (
    <Modal visible animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={SESSION.backBtn}>
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <Text style={styles.modalTitle}>{test.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <InfoBlock label={t('client.physicalTests.objective')} text={test.objective} />
          <InfoBlock label={t('client.physicalTests.whatToDo')} text={test.whatToDo} />
          <InfoBlock label={t('client.physicalTests.whatToMeasure')} text={test.whatToMeasure} />
          {assignment.latestResult ? (
            <View style={styles.latestCard}>
              <Text style={styles.latestTitle}>{t('client.physicalTests.latestResult')}</Text>
              <Text style={styles.resultScore}>{assignment.latestResult.rawScore}</Text>
              <Text style={styles.resultClass}>{assignment.latestResult.classification}</Text>
            </View>
          ) : null}
          <Pressable onPress={onRecord} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('client.physicalTests.recordResult')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }): React.JSX.Element {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
function RecordModal({
  assignment,
  onClose,
  t,
}: {
  assignment: ClientPhysicalTestAssignment | null;
  onClose: () => void;
  t: (key: string) => string;
}): React.JSX.Element {
  const clientQuery = useClientMeQuery();
  const mutation = useRecordPhysicalTestResultMutation();
  const [gender, setGender] = useState<'F' | 'M'>('M');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [timeMin, setTimeMin] = useState('');
  const [timeSec, setTimeSec] = useState('');
  const [hr, setHr] = useState('');
  const [distance, setDistance] = useState('');
  const [reps, setReps] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!assignment) return;
    const client = clientQuery.data;
    if (client?.sex === 'female' || client?.sex === 'F') setGender('F');
    else if (client?.sex === 'male' || client?.sex === 'M') setGender('M');
    if (client?.weightKg) setWeight(String(client.weightKg));
    if (client?.birthDate) {
      const birth = new Date(client.birthDate);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1;
      if (years > 0) setAge(String(years));
    }
    setTimeMin('');
    setTimeSec('');
    setHr('');
    setDistance('');
    setReps('');
    setError(null);
  }, [assignment, clientQuery.data]);

  if (!assignment) return <></>;

  const handleSubmit = async () => {
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 5) {
      setError(t('client.physicalTests.form.ageRequired'));
      return;
    }
    const input: RecordPhysicalTestInput = {
      age: parsedAge,
      gender,
      ...(weight ? { weight: Number(weight) } : {}),
      ...(timeMin ? { timeMin: Number(timeMin) } : {}),
      ...(timeSec ? { timeSec: Number(timeSec) } : {}),
      ...(hr ? { hr: Number(hr) } : {}),
      ...(distance ? { distance: Number(distance) } : {}),
      ...(reps ? { reps: Number(reps) } : {}),
    };
    try {
      setError(null);
      await mutation.mutateAsync({ testId: assignment.physicalTestId, input });
      onClose();
    } catch {
      setError(t('client.physicalTests.form.submitError'));
    }
  };

  return (
    <Modal visible animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={SESSION.backBtn}>
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <Text style={styles.modalTitle}>{t('client.physicalTests.recordTitle')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.formHint}>{assignment.physicalTest.whatToMeasure}</Text>
          <Text style={styles.fieldLabel}>{t('client.physicalTests.form.gender')}</Text>
          <View style={styles.genderRow}>
            <Pressable onPress={() => setGender('M')} style={[styles.genderBtn, gender === 'M' && styles.genderBtnActive]}>
              <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>
                {t('client.physicalTests.form.male')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setGender('F')} style={[styles.genderBtn, gender === 'F' && styles.genderBtnActive]}>
              <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>
                {t('client.physicalTests.form.female')}
              </Text>
            </Pressable>
          </View>
          <FormField
            label={t('client.physicalTests.form.age')}
            value={age}
            onChange={setAge}
            keyboardType={KEYBOARD_NUMBER_PAD}
          />
          <FormField
            label={t('client.physicalTests.form.weight')}
            value={weight}
            onChange={setWeight}
            keyboardType={KEYBOARD_DECIMAL_PAD}
          />
          <View style={styles.timeRow}>
            <FormField
              label={t('client.physicalTests.form.timeMin')}
              value={timeMin}
              onChange={setTimeMin}
              keyboardType={KEYBOARD_NUMBER_PAD}
              flex
            />
            <FormField
              label={t('client.physicalTests.form.timeSec')}
              value={timeSec}
              onChange={setTimeSec}
              keyboardType={KEYBOARD_NUMBER_PAD}
              flex
            />
          </View>
          <FormField
            label={t('client.physicalTests.form.hr')}
            value={hr}
            onChange={setHr}
            keyboardType={KEYBOARD_NUMBER_PAD}
          />
          <FormField
            label={t('client.physicalTests.form.distance')}
            value={distance}
            onChange={setDistance}
            keyboardType={KEYBOARD_DECIMAL_PAD}
          />
          <FormField
            label={t('client.physicalTests.form.reps')}
            value={reps}
            onChange={setReps}
            keyboardType={KEYBOARD_NUMBER_PAD}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={mutation.isPending}
            onPress={() => void handleSubmit()}
            style={[styles.primaryBtn, mutation.isPending && { opacity: 0.7 }]}
          >
            <Text style={styles.primaryBtnText}>
              {mutation.isPending ? t('client.physicalTests.form.saving') : t('client.physicalTests.form.submit')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChange,
  keyboardType,
  flex,
}: {
  flex?: boolean;
  keyboardType?: 'decimal-pad' | 'number-pad';
  label: string;
  onChange: (value: string) => void;
  value: string;
}): React.JSX.Element {
  return (
    <View style={[styles.fieldWrap, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput keyboardType={keyboardType} onChangeText={onChange} style={styles.input} value={value} />
    </View>
  );
}

function groupByCategory(assignments: ClientPhysicalTestAssignment[]): CategoryGroup[] {
  const map = new Map<string, ClientPhysicalTestAssignment[]>();
  for (const assignment of assignments) {
    const category = assignment.physicalTest.category;
    const list = map.get(category) ?? [];
    list.push(assignment);
    map.set(category, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, tests]) => ({
      category,
      tests: tests.sort((a, b) => a.physicalTest.sortOrder - b.physicalTest.sortOrder),
    }));
}

function flattenHistory(
  assignments: ClientPhysicalTestAssignment[],
): Array<{ assignment: ClientPhysicalTestAssignment; result: PhysicalTestResultView }> {
  const items: Array<{ assignment: ClientPhysicalTestAssignment; result: PhysicalTestResultView }> = [];
  for (const assignment of assignments) {
    for (const result of assignment.results) {
      items.push({ assignment, result });
    }
  }
  return items.sort((a, b) => new Date(b.result.measuredAt).getTime() - new Date(a.result.measuredAt).getTime());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  categoryLabel: {
    color: LIGHT.accentDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categorySection: { gap: 8, marginBottom: 16 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  container: SCREEN.root,
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  fieldLabel: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  fieldWrap: { marginBottom: 12 },
  formHint: { color: LIGHT.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  genderBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  genderBtnActive: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderText: { color: LIGHT.textMuted, fontSize: 14, fontWeight: '700' },
  genderTextActive: { color: LIGHT.textOnNavy },
  historyCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  historyDate: { color: LIGHT.textMuted, fontSize: 12 },
  historyName: { color: LIGHT.textStrong, flex: 1, fontSize: 14, fontWeight: '700' },
  historyTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  infoBlock: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
    padding: 14,
  },
  infoLabel: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  infoText: { color: LIGHT.textStrong, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  latestCard: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 4,
    marginBottom: 16,
    padding: 14,
  },
  latestTitle: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '800' },
  levelBadge: {
    backgroundColor: LIGHT.indigoSoft,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelBadgeText: { color: LIGHT.indigo, fontSize: 11, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  modalContent: { padding: 16, paddingBottom: 40 },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  modalRoot: { backgroundColor: LIGHT.bgSoft, flex: 1 },
  modalTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 17, fontWeight: '800' },
  noResult: { color: LIGHT.textMuted, fontSize: 12 },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: LIGHT.textOnNavy, fontSize: 15, fontWeight: '800' },
  resultClass: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
  resultRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  resultScore: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: { borderBottomColor: LIGHT.accent },
  tabBar: {
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabText: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: LIGHT.textStrong },
  testCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  testCardTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  testName: { color: LIGHT.textStrong, flex: 1, fontSize: 15, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 8 },
});
