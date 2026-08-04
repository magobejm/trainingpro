import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useAuthStore } from '../../store/auth.store';
import { useClientMeQuery, type ClientMe } from '../../data/hooks/useClientMeQuery';
import {
  useClientRoutineQuery,
  type ClientRoutine,
  type ClientRoutineDay,
  type ClientRoutineExercise,
} from '../../data/hooks/useClientRoutineQuery';
import { useEnsureClientSessionMutation } from '../../data/hooks/useTodaySession';
import { RoutineExerciseNotes } from '../../screens/client/RoutineExerciseNotes';
import { LIGHT } from '../../theme/light';
import { InfoButton, PrimaryButton, StatSquare } from '../../theme/primitives';
import { AvatarImage, OverlayBackHeader } from './client-shell.primitives';
import { s } from './client-shell.styles';

const BTN_VARIANT_SUCCESS = 'success' as const;

export function ProfilePanel(props: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { data: client, isLoading } = useClientMeQuery();
  const clearSession = useAuthStore((state) => state.clearSession);
  if (isLoading || !client) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} />
        <View style={s.centered}>
          <ActivityIndicator color={LIGHT.accent} />
        </View>
      </View>
    );
  }
  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <ProfileHero client={client} t={t} />
        <ProfileFields client={client} />
        <View style={s.statGrid}>
          <StatSquare label={t('mobile.client.profile.waist')} value={client.waistCm} />
          <StatSquare label={t('mobile.client.profile.hip')} value={client.hipCm} />
          <StatSquare label={'FC Max'} value={client.fcMax} />
          <StatSquare label={'FC Res'} value={client.fcRest} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          <View style={{ flex: 1, gap: 16 }}>
            <ObjectivesSection client={client} t={t} />
            <Pressable style={s.photoBtn}>
              <Text style={{ fontSize: 24 }}>{'🖼️'}</Text>
              <Text style={s.photoBtnText}>{t('mobile.client.profile.photos')}</Text>
            </Pressable>
            <ProgressPhotosSection photos={client.progressPhotos} />
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            {client.fitnessLevel ? (
              <View>
                <Text style={s.sectionLabel}>{t('mobile.client.profile.fitnessLevel')}</Text>
                <View style={[s.fieldCard, { alignItems: 'center', marginTop: 6 }]}>
                  <Text style={s.fieldValue}>{client.fitnessLevel}</Text>
                </View>
              </View>
            ) : null}
            {client.considerations ? (
              <InfoButton label={t('mobile.client.profile.considerations')} onPress={() => {}} />
            ) : null}
            {client.allergies ? <InfoButton label={t('mobile.client.profile.allergies')} onPress={() => {}} /> : null}
            {client.injuries ? <InfoButton label={t('mobile.client.profile.injuries')} onPress={() => {}} /> : null}
          </View>
        </View>
        <MedicalSection client={client} />
        {client.notes ? <NotesSection notes={client.notes} t={t} /> : null}
        <Pressable onPress={clearSession} style={s.logoutBtn}>
          <Text style={s.logoutBtnText}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ProfileHero(props: { client: ClientMe; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.profileHero}>
      <View style={s.heroAvatarWrap}>
        <AvatarImage avatarUrl={props.client.avatarUrl} size={64} />
      </View>
      <View style={s.heroInfo}>
        <Text style={s.heroName}>{`${props.client.firstName} ${props.client.lastName}`}</Text>
        <View style={s.heroStatusRow}>
          <View style={s.heroStatusDot} />
          <Text style={s.heroStatusText}>{props.t('mobile.client.profile.active')}</Text>
        </View>
      </View>
      <View style={s.profileStatsRow}>
        <View style={s.profileStatCol}>
          <Text style={s.profileStatValue}>{props.client.heightCm ?? '–'}</Text>
          <Text style={s.profileStatLabel}>{props.t('mobile.client.profile.height')}</Text>
        </View>
        <View style={s.profileStatCol}>
          <Text style={s.profileStatValue}>{props.client.weightKg ?? '–'}</Text>
          <Text style={s.profileStatLabel}>{props.t('mobile.client.profile.weight')}</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileFields(props: { client: ClientMe }): React.JSX.Element {
  return (
    <View style={{ gap: 12 }}>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Nombre completo'}</Text>
        <Text style={s.fieldValue}>{`${props.client.firstName} ${props.client.lastName}`}</Text>
      </View>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Email'}</Text>
        <Text style={s.fieldValue}>{props.client.email ?? '–'}</Text>
      </View>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Teléfono'}</Text>
        <Text style={s.fieldValue}>{props.client.phone ?? '–'}</Text>
      </View>
    </View>
  );
}

function ObjectivesSection(props: { client: ClientMe; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>{props.t('mobile.client.profile.objective')}</Text>
      <View style={s.objectivePill}>
        <Text style={s.objectivePillText}>{props.client.objective ?? '–'}</Text>
      </View>
      {props.client.secondaryObjectives.length > 0 && (
        <View style={s.chipRow}>
          {props.client.secondaryObjectives.map((obj) => (
            <View key={obj} style={s.chip}>
              <Text style={s.chipText}>{obj}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ProgressPhotosSection(props: { photos: ClientMe['progressPhotos'] }): React.JSX.Element {
  if (!props.photos || props.photos.length === 0) return <View />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosRow}>
      {props.photos
        .filter((p) => !p.archived)
        .map((photo) => (
          <Image key={photo.id} source={{ uri: photo.imageUrl }} style={s.photoThumb} />
        ))}
    </ScrollView>
  );
}

function MedicalSection(props: { client: ClientMe }): React.JSX.Element {
  const hasAny = props.client.injuries || props.client.allergies || props.client.considerations;
  if (!hasAny) return <View />;
  return (
    <View style={s.sectionCard}>
      {props.client.injuries ? <MedicalRow color={LIGHT.red} label={'Lesiones'} value={props.client.injuries} /> : null}
      {props.client.allergies ? <MedicalRow color={LIGHT.orange} label={'Alergias'} value={props.client.allergies} /> : null}
      {props.client.considerations ? (
        <MedicalRow color={LIGHT.accent} label={'A tener en cuenta'} value={props.client.considerations} />
      ) : null}
    </View>
  );
}

function MedicalRow(props: { color: string; label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.medicalRow}>
      <View style={[s.medicalDot, { backgroundColor: props.color }]} />
      <View style={s.medicalInfo}>
        <Text style={s.medicalLabel}>{props.label}</Text>
        <Text style={s.medicalValue}>{props.value}</Text>
      </View>
    </View>
  );
}

function NotesSection(props: { notes: string; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.notesCard}>
      <Text style={s.sectionLabel}>{props.t('mobile.client.profile.notes')}</Text>
      <Text style={s.notesText}>{props.notes}</Text>
    </View>
  );
}

export function RoutinePanel(props: { onClose: () => void; onSelectDay: (d: ClientRoutineDay) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { data: routine, isLoading } = useClientRoutineQuery();
  const todayIdx = new Date().getDay();
  const todayDay = routine?.planDays.length ? routine.planDays[todayIdx % routine.planDays.length] : null;
  const otherDays = useMemo(
    () => (routine?.planDays ?? []).filter((d) => d.id !== todayDay?.id),
    [routine?.planDays, todayDay?.id],
  );

  if (isLoading) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} title={t('mobile.client.routine.title')} />
        <View style={s.centered}>
          <ActivityIndicator color={LIGHT.accent} />
        </View>
      </View>
    );
  }
  if (!routine) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} title={t('mobile.client.routine.title')} />
        <View style={s.centered}>
          <Text style={s.emptyText}>{t('mobile.client.routine.empty')}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <RoutineHeroCard routine={routine} t={t} />
        {todayDay ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.routineSectionLabel}>{t('mobile.client.routine.today')}</Text>
            <RoutineDayCard day={todayDay} isActive onPress={() => props.onSelectDay(todayDay)} />
          </View>
        ) : null}
        <View style={s.routineSeparator} />
        <View style={{ gap: 16 }}>
          {otherDays.map((day) => (
            <RoutineDayCard key={day.id} day={day} onPress={() => props.onSelectDay(day)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function RoutineHeroCard(props: { routine: ClientRoutine; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.routineHero}>
      <Text style={s.routineHeroName}>{props.routine.name}</Text>
      <Text
        style={s.routineHeroSub}
      >{`${props.routine.planDays.length} ${props.t('mobile.client.routine.trainingDays')}`}</Text>
      {props.routine.expectedCompletionDays ? (
        <View style={s.routineHeroMeta}>
          <Text style={s.sectionLabel}>{props.t('mobile.client.routine.mesocycle')}</Text>
          <Text style={s.fieldValue}>{`${props.routine.expectedCompletionDays} días`}</Text>
        </View>
      ) : null}
    </View>
  );
}

function RoutineDayCard(props: { day: ClientRoutineDay; isActive?: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[s.dayCard, props.isActive && s.dayCardActive]}>
      <View style={s.dayInfo}>
        <Text style={s.dayName}>{props.day.title}</Text>
        <Text style={s.dayExCount}>{props.day.title}</Text>
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
        <View style={s.dayExPill}>
          <Text style={s.dayExPillText}>{`${props.day.exercises.length} ejercicios`}</Text>
        </View>
        <Text style={s.dayChevron}>{'›'}</Text>
      </View>
    </Pressable>
  );
}

type DayDetailPanelProps = {
  day: ClientRoutineDay;
  onClose: () => void;
  onStartTraining: (sessionId: string) => void;
};

export function DayDetailPanel(props: DayDetailPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const ensureMutation = useEnsureClientSessionMutation();
  const today = new Date().toISOString().slice(0, 10);

  const handleStartTraining = () => {
    ensureMutation.mutate(
      { planDayId: props.day.id, sessionDate: today },
      { onSuccess: (session) => props.onStartTraining(session.id) },
    );
  };

  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={[s.panelContent, { paddingBottom: 80 }]}>
        <View style={{ alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: LIGHT.textStrong, fontSize: 28, fontWeight: '800' }}>{props.day.title}</Text>
          <View style={s.dayExPill}>
            <Text style={s.dayExPillText}>{`${props.day.exercises.length} ejer`}</Text>
          </View>
        </View>
        {props.day.exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          />
        ))}
        <PrimaryButton
          disabled={ensureMutation.isPending}
          label={ensureMutation.isPending ? t('mobile.shell.loading') : t('mobile.client.day.startTraining')}
          onPress={handleStartTraining}
          variant={BTN_VARIANT_SUCCESS}
        />
        {ensureMutation.isError ? <Text style={s.startTrainingError}>{t('mobile.client.day.startError')}</Text> : null}
        {props.day.notes ? (
          <View style={s.dayNotesCard}>
            <Text style={s.sectionLabel}>{t('mobile.client.day.notes')}</Text>
            <Text style={s.notesText}>{props.day.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ExerciseCard(props: {
  exercise: ClientRoutineExercise;
  expanded: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const ex = props.exercise;
  const typeBadge = resolveTypeBadge(ex.type);
  const repsValue = ex.repsMin && ex.repsMax ? `${ex.repsMin}-${ex.repsMax}` : (ex.repsMin ?? ex.repsMax);
  const hasNotes = Boolean(
    ex.coachInstructions?.trim() || ex.notes?.trim() || ex.sets.some((set) => set.note || set.advancedTechnique),
  );
  return (
    <Pressable onPress={props.onToggle} style={[s.exerciseCard, { marginBottom: 16 }]}>
      <View style={s.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.exerciseName}>{ex.displayName}</Text>
          {!props.expanded && ex.setsPlanned ? (
            <Text style={{ color: LIGHT.accent, fontSize: 14, fontWeight: '700', marginTop: 4 }}>
              {`${ex.setsPlanned} series`}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {hasNotes ? (
            <View style={panelStyles.iconBtn}>
              <Text>{'📄'}</Text>
            </View>
          ) : null}
          <Pressable onPress={props.onToggle} style={panelStyles.iconBtn}>
            <Text style={s.exerciseChevron}>{props.expanded ? '▴' : '▾'}</Text>
          </Pressable>
        </View>
      </View>
      {props.expanded && (
        <View style={s.exerciseBody}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={s.sectionLabel}>{t('mobile.client.exercise.details')}</Text>
            {repsValue ? (
              <Text style={{ color: LIGHT.textStrong, fontSize: 14, fontWeight: '700' }}>{String(repsValue)}</Text>
            ) : null}
          </View>
          <View style={s.exerciseMetaRow}>
            <ExMeta label={'Series'} value={ex.setsPlanned} />
            <ExMeta label={'Reps'} value={repsValue} />
            <ExMeta label={'RPE'} value={ex.targetRpe} />
            <ExMeta label={'RIR'} value={ex.targetRir} />
            <ExMeta label={'Descanso'} value={ex.restSeconds ? `${ex.restSeconds}s` : null} />
          </View>
          <RoutineExerciseNotes exercise={ex} />
          <View style={[s.exerciseTypeBadge, { alignSelf: 'flex-start', backgroundColor: typeBadge.bg, marginTop: 8 }]}>
            <Text style={[s.exerciseTypeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const panelStyles = StyleSheet.create({
  iconBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

// merge iconBtn into usage - actually I used s.iconBtn which doesn't exist. Fix with inline or add to styles.

function ExMeta(props: { label: string; value: string | number | null | undefined }): React.JSX.Element | null {
  if (props.value === null || props.value === undefined) return null;
  return (
    <View style={s.exMetaItem}>
      <Text style={s.exMetaLabel}>{props.label}</Text>
      <Text style={s.exMetaValue}>{String(props.value)}</Text>
    </View>
  );
}

function resolveTypeBadge(type: string): { bg: string; label: string; text: string } {
  const map: Record<string, { bg: string; label: string; text: string }> = {
    cardio: { bg: LIGHT.accentSoft, label: 'Cardio', text: LIGHT.accentDark },
    isometric: { bg: '#ffedd5', label: 'Isométrico', text: LIGHT.orange },
    mobility: { bg: LIGHT.emeraldSoft, label: 'Movilidad', text: LIGHT.success },
    plio: { bg: '#fef9c3', label: 'Pliométrico', text: '#ca8a04' },
    sport: { bg: '#f3e8ff', label: 'Deporte', text: LIGHT.purple },
    strength: { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark },
  };
  return map[type] ?? { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark };
}
