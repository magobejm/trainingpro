import React, { useState } from 'react';
import { Image, Pressable, Text, View, type ViewStyle } from 'react-native';
import { IconButton, useBreakpoint, useReducedMotion } from '@trainerpro/ui';
import { C, ss } from './LibraryRoutinesScreen.styles';
import { Trophy, Activity, Pencil, Trash2, UserPlus } from 'lucide-react';
import { type RoutineTemplateView } from '../../data/hooks/useRoutineTemplates';
import { type WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';
import { readFrontEnv } from '../../data/env';

type T = (k: string, opts?: Record<string, unknown>) => string;
type MediaMap = Record<string, string | null>;

function apiBase(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const ROUTINE_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/routine-placeholder.jpg`;
const WARMUP_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/warmup-placeholder.png`;

export function RoutineCard(props: {
  clientId: string | null;
  tpl: RoutineTemplateView;
  mediaUrl: string;
  onAssign: (tpl: RoutineTemplateView) => void;
  onView: (tpl: RoutineTemplateView) => void;
  onEdit: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  const { tpl, t } = props;
  const bp = useBreakpoint();
  const reduced = useReducedMotion();
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...{ dataSet: { 'interactive-card': reduced ? 'reduced' : 'true' } }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onView(tpl)}
      style={[ss.card, bp === 'md' && ss.cardMd, bp === 'sm' && ss.cardSm]}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Trophy color={C.blue} size={18} />}
        onAssign={canEdit ? () => props.onAssign(tpl) : undefined}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
        t={t}
      />
      <CardImage hovered={hovered && !reduced} mediaUrl={props.mediaUrl} />
      <View {...{ dataSet: { 'density-row': 'true' } }} style={ss.cardBody}>
        <Text style={ss.cardName}>{tpl.name}</Text>
        <View style={ss.cardMeta}>
          <Text style={ss.cardMetaBlue}>{t('coach.routine.list.days', { count: tpl.days.length })}</Text>
          {tpl.expectedCompletionDays ? (
            <Text style={ss.cardMetaGray}>{t('coach.routineLib.microcycle', { count: tpl.expectedCompletionDays })}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function WarmupCard(props: {
  tpl: WarmupTemplateView;
  mediaUrl: string;
  onView: (tpl: WarmupTemplateView) => void;
  onEdit: (tpl: WarmupTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  const { tpl, t } = props;
  const bp = useBreakpoint();
  const reduced = useReducedMotion();
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...{ dataSet: { 'interactive-card': reduced ? 'reduced' : 'true' } }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onView(tpl)}
      style={[ss.card, bp === 'md' && ss.cardMd, bp === 'sm' && ss.cardSm]}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Activity color={C.blue} size={18} />}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
        t={t}
      />
      <CardImage hovered={hovered && !reduced} mediaUrl={props.mediaUrl} />
      <View {...{ dataSet: { 'density-row': 'true' } }} style={ss.cardBody}>
        <Text style={ss.cardName}>{tpl.name}</Text>
        <Text style={ss.cardMetaGray}>{t('coach.warmupPlanner.blocksCount', { count: tpl.items.length })}</Text>
      </View>
    </Pressable>
  );
}

function CardTopBar(props: {
  canEdit: boolean;
  icon: React.ReactNode;
  onAssign?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: T;
}) {
  return (
    <View style={ss.cardTop}>
      <View style={ss.dot} />
      {props.icon}
      <View style={{ flex: 1 }} />
      {props.onAssign && (
        <IconButton
          accessibilityLabel={props.t('common.assign')}
          icon={() => <UserPlus color={C.blue} size={16} />}
          onPress={props.onAssign}
          size={28}
        />
      )}
      {props.canEdit ? (
        <>
          <IconButton
            accessibilityLabel={props.t('coach.library.exercises.actions.edit')}
            icon={(color) => <Pencil color={color} size={14} />}
            onPress={props.onEdit}
            size={28}
          />
          <IconButton
            accessibilityLabel={props.t('coach.library.exercises.actions.delete')}
            icon={(color) => <Trash2 color={color} size={14} />}
            onPress={props.onDelete}
            size={28}
            tone="danger"
          />
        </>
      ) : null}
    </View>
  );
}

function CardImage({ mediaUrl, hovered }: { mediaUrl: string; hovered: boolean }) {
  return (
    <View style={ss.cardImg}>
      <Image blurRadius={16} resizeMode={'cover'} source={{ uri: mediaUrl }} style={ss.imgBackdrop} />
      <View style={ss.imgShade} />
      <Image
        resizeMode={'contain'}
        source={{ uri: mediaUrl }}
        style={[ss.imgInner, hovered && (ss.imgInnerHovered as ViewStyle)]}
      />
    </View>
  );
}

/* ── Pure helpers ── */

export function pickRoutineImage(tpl: RoutineTemplateView, map: MediaMap): string {
  for (const day of tpl.days) {
    for (const ex of day.exercises ?? []) {
      if (ex.exerciseLibraryId && map[ex.exerciseLibraryId]) {
        return map[ex.exerciseLibraryId] as string;
      }
    }
  }
  return ROUTINE_PLACEHOLDER();
}

export function pickWarmupImage(tpl: WarmupTemplateView, map: MediaMap): string {
  for (const item of tpl.items) {
    const id =
      item.exerciseLibraryId ?? item.mobilityExerciseLibraryId ?? item.plioExerciseLibraryId ?? item.cardioMethodLibraryId;
    if (id && map[id]) return map[id] as string;
  }
  return WARMUP_PLACEHOLDER();
}
