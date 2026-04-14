import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
import { DARK } from '../dark';
import { MENU_ITEMS, type MenuItem } from './client-shell.constants';
import { AvatarImage, OverlayBackHeader } from './client-shell.primitives';
import { s } from './client-shell.styles';

type MenuConfigProps = {
  activeIds: string[];
  onClose: () => void;
  onToggle: (id: string) => void;
};

export function MenuConfigPanel(props: MenuConfigProps): React.JSX.Element {
  const activeItems = useMemo(
    () => props.activeIds.map((id) => MENU_ITEMS.find((m) => m.id === id)).filter(Boolean) as MenuItem[],
    [props.activeIds],
  );
  const availableItems = useMemo(() => MENU_ITEMS.filter((m) => !props.activeIds.includes(m.id)), [props.activeIds]);
  return (
    <View style={s.menuPanel}>
      <View style={s.menuHeader}>
        <Text style={s.menuTitle}>{'Configurar Menú'}</Text>
        <Pressable onPress={props.onClose} style={s.closeBtn}>
          <Text style={s.closeBtnText}>{'✕'}</Text>
        </Pressable>
      </View>
      <ScrollView style={s.menuScroll} contentContainerStyle={s.menuContent}>
        <View style={s.menuSectionHeader}>
          <Text style={s.menuSectionLabel}>{'MENÚ PRINCIPAL'}</Text>
          <Text style={[s.menuCounter, props.activeIds.length >= 4 ? s.menuCounterFull : null]}>
            {`${props.activeIds.length} / 4`}
          </Text>
        </View>
        <View style={s.menuActiveBox}>
          {activeItems.map((item) => (
            <Pressable key={item.id} onPress={() => props.onToggle(item.id)} style={s.menuActiveItem}>
              <View style={s.menuActiveIcon}>
                <Text style={s.menuActiveEmoji}>{item.emoji}</Text>
              </View>
              <Text style={s.menuActiveLabel}>{item.label}</Text>
            </Pressable>
          ))}
          {activeItems.length === 0 && <Text style={s.menuEmptyText}>{'Toca un elemento para añadirlo'}</Text>}
        </View>
        <Text style={s.menuSectionLabel}>{'MÁS OPCIONES'}</Text>
        <View style={s.menuGrid}>
          {availableItems.map((item) => (
            <Pressable key={item.id} onPress={() => props.onToggle(item.id)} style={s.menuGridItem}>
              <View style={s.menuGridIcon}>
                <Text style={s.menuGridEmoji}>{item.emoji}</Text>
              </View>
              <Text style={s.menuGridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ProfilePanel(props: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { data: client, isLoading } = useClientMeQuery();
  const clearSession = useAuthStore((state) => state.clearSession);
  if (isLoading || !client) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} />
        <View style={s.centered}>
          <ActivityIndicator color={DARK.accent} />
        </View>
      </View>
    );
  }
  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <ProfileHero client={client} />
        <MetricsGrid client={client} />
        <DetailedMetrics client={client} />
        <ObjectivesSection client={client} t={t} />
        <ProgressPhotosSection photos={client.progressPhotos} />
        <MedicalSection client={client} />
        {client.notes ? <NotesSection notes={client.notes} t={t} /> : null}
        <Pressable onPress={clearSession} style={s.logoutBtn}>
          <Text style={s.logoutBtnText}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ProfileHero(props: { client: ClientMe }): React.JSX.Element {
  return (
    <View style={s.profileHero}>
      <View style={s.heroAvatarWrap}>
        <AvatarImage avatarUrl={props.client.avatarUrl} size={80} />
      </View>
      <View style={s.heroInfo}>
        <Text style={s.heroName}>{`${props.client.firstName} ${props.client.lastName}`}</Text>
        <View style={s.heroStatusRow}>
          <View style={s.heroStatusDot} />
          <Text style={s.heroStatusText}>{'Cliente Activo'}</Text>
        </View>
      </View>
    </View>
  );
}

function MetricsGrid(props: { client: ClientMe }): React.JSX.Element {
  return (
    <View style={s.metricsRow}>
      <MetricCard label={'Altura'} value={props.client.heightCm} unit={'cm'} />
      <MetricCard label={'Peso'} value={props.client.weightKg} unit={'kg'} />
      <MetricCard label={'Sexo'} value={props.client.sex} unit={''} />
    </View>
  );
}

function MetricCard(props: { label: string; unit: string; value: string | number | null }): React.JSX.Element {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricCardLabel}>{props.label}</Text>
      <Text style={s.metricCardValue}>
        {props.value ?? '–'}
        {props.unit ? <Text style={s.metricCardUnit}>{` ${props.unit}`}</Text> : null}
      </Text>
    </View>
  );
}

function DetailedMetrics(props: { client: ClientMe }): React.JSX.Element {
  return (
    <View style={s.detailedGrid}>
      <DetailRow label={'Cintura'} value={props.client.waistCm} unit={'cm'} />
      <DetailRow label={'Cadera'} value={props.client.hipCm} unit={'cm'} />
      <DetailRow label={'FCMax'} value={props.client.fcMax} unit={'bpm'} blue />
      <DetailRow label={'FCReposo'} value={props.client.fcRest} unit={'bpm'} blue />
    </View>
  );
}

function DetailRow(props: { blue?: boolean; label: string; unit: string; value: number | null }): React.JSX.Element {
  const labelColor = props.blue ? '#60a5fa' : DARK.textMuted;
  const valueColor = props.blue ? '#93c5fd' : '#ffffff';
  return (
    <View style={s.detailRow}>
      <Text style={[s.detailLabel, { color: labelColor }]}>{props.label}</Text>
      <Text style={[s.detailValue, { color: valueColor }]}>
        {props.value ?? '–'} <Text style={s.detailUnit}>{props.unit}</Text>
      </Text>
    </View>
  );
}

function ObjectivesSection(props: { client: ClientMe; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>{props.t('mobile.client.profile.objective')}</Text>
      <View style={s.objectivePill}>
        <Text style={s.objectivePillText}>{props.client.objective}</Text>
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
      {props.client.fitnessLevel ? (
        <View style={s.levelRow}>
          <Text style={s.levelLabel}>{'Nivel fitness'}</Text>
          <Text style={s.levelValue}>{props.client.fitnessLevel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProgressPhotosSection(props: { photos: ClientMe['progressPhotos'] }): React.JSX.Element {
  if (!props.photos || props.photos.length === 0) {
    return <View />;
  }
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>{'FOTOS DE PROGRESO'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosRow}>
        {props.photos
          .filter((p) => !p.archived)
          .map((photo) => (
            <Image key={photo.id} source={{ uri: photo.imageUrl }} style={s.photoThumb} />
          ))}
      </ScrollView>
    </View>
  );
}

function MedicalSection(props: { client: ClientMe }): React.JSX.Element {
  const hasAny = props.client.injuries || props.client.allergies || props.client.considerations;
  if (!hasAny) {
    return <View />;
  }
  return (
    <View style={s.sectionCard}>
      {props.client.injuries ? <MedicalRow color={'#f87171'} label={'Lesiones'} value={props.client.injuries} /> : null}
      {props.client.allergies ? <MedicalRow color={'#fb923c'} label={'Alergias'} value={props.client.allergies} /> : null}
      {props.client.considerations ? (
        <MedicalRow color={'#60a5fa'} label={'A tener en cuenta'} value={props.client.considerations} />
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
  if (isLoading) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} title={t('mobile.client.routine.title')} />
        <View style={s.centered}>
          <ActivityIndicator color={DARK.accent} />
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
      <OverlayBackHeader onClose={props.onClose} title={t('mobile.client.routine.title')} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <RoutineHeroCard routine={routine} t={t} />
        {routine.planDays.map((day) => (
          <RoutineDayCard key={day.id} day={day} onPress={() => props.onSelectDay(day)} />
        ))}
      </ScrollView>
    </View>
  );
}

function RoutineHeroCard(props: { routine: ClientRoutine; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.routineHero}>
      <Text style={s.routineHeroLabel}>{props.t('mobile.client.routine.mesocycle')}</Text>
      <Text style={s.routineHeroName}>{props.routine.name}</Text>
      <View style={s.routineChipRow}>
        <View style={s.routineChip}>
          <Text style={s.routineChipText}>{`${props.routine.planDays.length} Días Entreno`}</Text>
        </View>
        {props.routine.expectedCompletionDays ? (
          <View style={s.routineChip}>
            <Text style={s.routineChipText}>{`${props.routine.expectedCompletionDays} Días Microciclo`}</Text>
          </View>
        ) : null}
        {props.routine.objectives.map((obj) => (
          <View key={obj} style={s.routineChip}>
            <Text style={s.routineChipText}>{obj}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoutineDayCard(props: { day: ClientRoutineDay; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={s.dayCard}>
      <View style={s.dayBadge}>
        <Text style={s.dayBadgeText}>{`D${props.day.dayIndex}`}</Text>
      </View>
      <View style={s.dayInfo}>
        <Text style={s.dayName}>{props.day.title}</Text>
        <Text style={s.dayExCount}>{`${props.day.exercises.length} ejercicios`}</Text>
      </View>
      <Text style={s.dayChevron}>{'›'}</Text>
    </Pressable>
  );
}

export function DayDetailPanel(props: { day: ClientRoutineDay; onClose: () => void }): React.JSX.Element {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} title={`Día ${props.day.dayIndex} – ${props.day.title}`} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <Text style={s.exerciseCount}>{`${props.day.exercises.length} Ejercicios`}</Text>
        {props.day.exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          />
        ))}
        {props.day.notes ? (
          <View style={s.dayNotesCard}>
            <Text style={s.sectionLabel}>{'Notas del día'}</Text>
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
  const ex = props.exercise;
  const typeBadge = resolveTypeBadge(ex.type);
  const repsValue = ex.repsMin && ex.repsMax ? `${ex.repsMin}-${ex.repsMax}` : (ex.repsMin ?? ex.repsMax);
  return (
    <Pressable onPress={props.onToggle} style={s.exerciseCard}>
      <View style={s.exerciseHeader}>
        <Text style={s.exerciseName}>{ex.displayName}</Text>
        <View style={[s.exerciseTypeBadge, { backgroundColor: typeBadge.bg }]}>
          <Text style={[s.exerciseTypeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
        </View>
        <Text style={s.exerciseChevron}>{props.expanded ? '▴' : '▾'}</Text>
      </View>
      {props.expanded && (
        <View style={s.exerciseBody}>
          <View style={s.exerciseMetaRow}>
            <ExMeta label={'Series'} value={ex.setsPlanned} />
            <ExMeta label={'Reps'} value={repsValue} />
            <ExMeta label={'RPE'} value={ex.targetRpe} />
            <ExMeta label={'RIR'} value={ex.targetRir} />
            <ExMeta label={'Descanso'} value={ex.restSeconds ? `${ex.restSeconds}s` : null} />
          </View>
          {ex.notes ? <Text style={s.exerciseNotes}>{ex.notes}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

function ExMeta(props: { label: string; value: string | number | null | undefined }): React.JSX.Element | null {
  if (props.value === null || props.value === undefined) {
    return null;
  }
  return (
    <View style={s.exMetaItem}>
      <Text style={s.exMetaLabel}>{props.label}</Text>
      <Text style={s.exMetaValue}>{String(props.value)}</Text>
    </View>
  );
}

function resolveTypeBadge(type: string): { bg: string; label: string; text: string } {
  const map: Record<string, { bg: string; label: string; text: string }> = {
    cardio: { bg: 'rgba(59,130,246,0.2)', label: 'Cardio', text: '#60a5fa' },
    isometric: { bg: 'rgba(251,146,60,0.2)', label: 'Isométrico', text: '#fb923c' },
    mobility: { bg: 'rgba(52,211,153,0.2)', label: 'Movilidad', text: '#34d399' },
    plio: { bg: 'rgba(250,204,21,0.2)', label: 'Pliométrico', text: '#facc15' },
    sport: { bg: 'rgba(167,139,250,0.2)', label: 'Deporte', text: '#a78bfa' },
    strength: { bg: 'rgba(236,72,153,0.15)', label: 'Fuerza', text: '#ec4899' },
  };
  return map[type] ?? { bg: 'rgba(236,72,153,0.15)', label: 'Fuerza', text: '#ec4899' };
}
