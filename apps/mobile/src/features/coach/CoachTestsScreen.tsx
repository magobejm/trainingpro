import { useCoachEditor } from './useCoachEditor';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { physicalTestFields } from '@trainerpro/shared';
import { useTranslation } from 'react-i18next';
import type { PhysicalTestView, ClientPhysicalTestAssignment } from '../../data/hooks/usePhysicalTests';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { CoachButton, CoachField, CoachPage, CoachSelect, CoachStatus, confirmCoachDelete, ui } from './CoachUi';
import { localCoachDate } from './coach-calendar';
import { CoachValueTree } from './CoachProgressScreen';
import { testForCoachSchedule, type CoachPhysicalTestSchedule } from './coach-test-schedule';
export function CoachTestsScreen({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const {
    value: record,
    select: setRecord,
    close: closeEditor,
  } = useCoachEditor<{ test: PhysicalTestView; scheduleId?: string }>();
  const [date, setDate] = useState(localCoachDate());
  const catalog = useCoachQuery<PhysicalTestView[]>('/physical-tests');
  const assigned = useCoachQuery<ClientPhysicalTestAssignment[]>('/clients/' + clientId + '/physical-tests');
  const schedules = useCoachQuery<CoachPhysicalTestSchedule[]>('/clients/' + clientId + '/physical-test-schedules');
  const write = useCoachWrite();
  if (record) return <TestResultEditor clientId={clientId} {...record} onBack={closeEditor} />;
  return (
    <CoachPage title={t('coachWorkspace.tests')}>
      <CoachStatus query={catalog} />
      <CoachSelect
        label={t('coachWorkspace.tests')}
        value={selected}
        onChange={setSelected}
        options={[{ value: '', label: '—' }, ...(catalog.data ?? []).map((test) => ({ value: test.id, label: test.name }))]}
      />
      <CoachButton
        label={t('coachWorkspace.assign')}
        disabled={!selected || write.isPending}
        onPress={() => write.mutate({ path: `/clients/${clientId}/physical-tests/${selected}` })}
      />
      <CoachField label={t('coachWorkspace.date')} value={date} onChange={setDate} />
      <CoachButton
        label={t('coachWorkspace.schedule')}
        disabled={!selected || !/^\d{4}-\d{2}-\d{2}$/.test(date) || write.isPending}
        onPress={() =>
          write.mutate({ path: `/clients/${clientId}/physical-test-schedules`, body: { physicalTestId: selected, date } })
        }
      />
      <CoachStatus query={assigned} empty={assigned.data?.length === 0} />
      {(assigned.data ?? []).map((assignment) => (
        <View key={assignment.id} style={ui.card}>
          <Text style={ui.label}>{assignment.physicalTest.name}</Text>
          <Text style={ui.text}>{assignment.physicalTest.whatToDo}</Text>
          <Text style={ui.muted}>{assignment.physicalTest.whatToMeasure}</Text>
          <CoachValueTree value={assignment.latestResult} />
          <CoachButton label={t('coachWorkspace.record')} onPress={() => setRecord({ test: assignment.physicalTest })} />
          <CoachButton
            label={t('coachWorkspace.unassign')}
            disabled={write.isPending}
            danger
            onPress={() =>
              confirmCoachDelete(
                assignment.physicalTest.name,
                () =>
                  write.mutate({
                    path: `/clients/${clientId}/physical-tests/${assignment.physicalTestId}`,
                    method: 'DELETE',
                  }),
                t,
              )
            }
          />
          {assignment.results
            .filter((result) => result.id !== assignment.latestResult?.id)
            .map((result) => (
              <CoachValueTree key={result.id} value={result} />
            ))}
        </View>
      ))}
      <CoachStatus query={schedules} />
      {(schedules.data ?? []).map((schedule) => (
        <ScheduledTestRow
          key={schedule.id}
          schedule={schedule}
          test={testForCoachSchedule(schedule, catalog.data ?? [])}
          onRecord={setRecord}
          write={write}
          clientId={clientId}
        />
      ))}
    </CoachPage>
  );
}
function TestResultEditor({
  clientId,
  test,
  scheduleId,
  onBack,
}: {
  clientId: string;
  test: PhysicalTestView;
  scheduleId?: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const write = useCoachWrite();
  const draft = useCoachDraft<Record<string, string>>(
    'test:' + clientId + ':' + test.id + ':' + (scheduleId ?? 'unscheduled'),
    {
      gender: 'M',
      age: '',
      level: 'Recreacional',
    },
  );
  const set = (key: string, value: string) => draft.setValue((old) => ({ ...old, [key]: value }));
  const fields = physicalTestFields(test.name);
  const save = async () => {
    const body = physicalTestResultBody(draft.value);
    await write.mutateAsync({
      path: `/clients/${clientId}/physical-tests/${test.id}/results`,
      body: { ...body, ...(scheduleId ? { scheduleId } : {}) },
    });
    await draft.clear();
    onBack();
  };
  return (
    <CoachPage title={test.name} onBack={onBack}>
      <Text style={ui.text}>{test.whatToDo}</Text>
      <CoachSelect
        label={t('coachWorkspace.field.gender')}
        value={draft.value.gender ?? 'M'}
        onChange={(value) => set('gender', value)}
        options={['M', 'F'].map((value) => ({ value, label: t('coachWorkspace.gender.' + value) }))}
      />
      <CoachField
        label={t('coachWorkspace.field.age')}
        value={draft.value.age ?? ''}
        onChange={(value) => set('age', value)}
        numeric
      />
      {fields
        .filter((field) => !['age', 'gender'].includes(field))
        .map((field) =>
          field === 'eyesClosed' ? (
            <CoachSelect
              key={field}
              label={t('coachWorkspace.field.' + field)}
              value={draft.value[field] ?? 'false'}
              onChange={(value) => set(field, value)}
              options={[
                { value: 'false', label: t('coachWorkspace.no') },
                { value: 'true', label: t('coachWorkspace.yes') },
              ]}
            />
          ) : field === 'level' ? (
            <CoachSelect
              key={field}
              label={t('coachWorkspace.field.level')}
              value={draft.value.level ?? 'Recreacional'}
              onChange={(value) => set('level', value)}
              options={['Recreacional', 'Avanzado'].map((value) => ({ value, label: t('coachWorkspace.' + value) }))}
            />
          ) : (
            <CoachField
              key={field}
              label={t('coachWorkspace.field.' + field)}
              value={draft.value[field] ?? ''}
              onChange={(value) => set(field, value)}
              numeric
            />
          ),
        )}
      <CoachButton
        label={t('coachWorkspace.save')}
        disabled={
          !draft.ready ||
          Number(draft.value.age) < 5 ||
          Number(draft.value.age) > 120 ||
          fields.some((field) => field !== 'eyesClosed' && field !== 'level' && !draft.value[field])
        }
        loading={write.isPending}
        onPress={() => void save().catch(() => undefined)}
      />
    </CoachPage>
  );
}

function physicalTestResultBody(value: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [
        key,
        key === 'eyesClosed'
          ? value === 'true'
          : ['gender', 'level'].includes(key)
            ? value
            : Number(value.replace(',', '.')),
      ]),
  );
}

function ScheduledTestRow({
  schedule,
  test,
  onRecord,
  write,
  clientId,
}: {
  schedule: CoachPhysicalTestSchedule;
  test?: PhysicalTestView;
  onRecord: (record: { test: PhysicalTestView; scheduleId?: string }) => void;
  write: ReturnType<typeof useCoachWrite>;
  clientId: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={ui.card}>
      <Text style={ui.label}>
        {schedule.physicalTestName}
        {' · '}
        {schedule.scheduledDate.slice(0, 10)}
      </Text>
      <CoachValueTree value={schedule.result} />
      {!schedule.result && test ? (
        <CoachButton label={t('coachWorkspace.record')} onPress={() => onRecord({ test: test!, scheduleId: schedule.id })} />
      ) : null}
      <CoachButton
        label={t('coachWorkspace.cancel')}
        disabled={write.isPending}
        onPress={() =>
          confirmCoachDelete(
            schedule.physicalTestName,
            () => write.mutate({ path: `/clients/${clientId}/physical-test-schedules/${schedule.id}`, method: 'DELETE' }),
            t,
          )
        }
      />
    </View>
  );
}
