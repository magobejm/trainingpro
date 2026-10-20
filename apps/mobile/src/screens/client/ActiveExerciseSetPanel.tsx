import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { TFunction } from 'i18next';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import { formatRestLabel } from './session-completion.utils';
import { isRomScaleValue } from './rom-scale.utils';
import { keyboardForField, sanitizeSessionNumber } from './session-number-input';
import type { SetColumn, SetFieldKey } from './active-exercise.helpers';

const HIT = 48;

export function CurrentSetFields(props: {
  columns: SetColumn[];
  draft: Partial<Record<SetFieldKey, string>>;
  onChange: (key: SetFieldKey, value: string) => void;
  onFocus: (node: number) => void;
  onOpenRom: () => void;
  readOnly?: boolean;
  t: TFunction;
  targets: Record<string, string>;
}): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {props.columns.map((column) => (
        <SetColumnCell
          column={column}
          draft={props.draft[column.key] ?? ''}
          key={column.key}
          onChange={(value) => props.onChange(column.key, value)}
          onFocus={props.onFocus}
          onOpenRom={props.onOpenRom}
          readOnly={props.readOnly}
          t={props.t}
          target={props.targets[column.key] ?? '-'}
        />
      ))}
    </View>
  );
}

export function SetRestControl(props: {
  active: boolean;
  completed: boolean;
  disabled: boolean;
  remaining: number | null;
  restSeconds: number;
  onExpand: () => void;
  onStart: () => void;
  t: TFunction;
  countdown: React.ReactNode;
}): React.JSX.Element {
  if (props.completed) {
    return (
      <View style={[styles.restBtn, styles.restBtnDone]}>
        <Text style={[styles.restBtnText, styles.restBtnTextDone]}>{props.t('mobile.client.rest.completed')}</Text>
      </View>
    );
  }
  if (props.active && props.remaining != null) {
    return (
      <Pressable
        accessibilityLabel={props.t('client.today.restTimer')}
        accessibilityRole={'button'}
        onPress={props.onExpand}
        style={styles.restBtn}
      >
        {props.countdown}
      </Pressable>
    );
  }
  const label = `${props.t('client.today.restTimer')} ${formatRestLabel(props.restSeconds)}`;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={'button'}
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onStart}
      style={styles.restBtn}
    >
      <Text style={styles.restBtnText}>{label}</Text>
    </Pressable>
  );
}

export function ExerciseActionBar(props: {
  onOpenComment: () => void;
  onOpenNotes: () => void;
  onOpenVideo: () => void;
  t: TFunction;
}): React.JSX.Element {
  return (
    <View style={styles.actionBar}>
      <ActionButton
        icon={<CommentGlyph />}
        label={props.t('mobile.client.comment.title')}
        onPress={props.onOpenComment}
        surface={LIGHT.accentSoft}
        tint={LIGHT.accentDark}
      />
      <ActionButton
        icon={<VideoGlyph />}
        label={props.t('mobile.client.exercise.video')}
        onPress={props.onOpenVideo}
        surface={LIGHT.redSoft}
        tint={LIGHT.error}
      />
      <ActionButton
        icon={<NotesGlyph />}
        label={props.t('mobile.client.exercise.indications')}
        onPress={props.onOpenNotes}
        surface={LIGHT.emeraldSoft}
        tint={LIGHT.success}
      />
    </View>
  );
}

export function SetSaveButton(props: {
  busy: boolean;
  clean: boolean;
  onSave: () => void;
  setIndex: number;
  t: TFunction;
}): React.JSX.Element {
  const label = props.t(props.clean ? 'mobile.client.session.setSaved' : 'mobile.client.session.saveSet');
  return (
    <Pressable
      accessibilityLabel={`${label} ${props.setIndex}`}
      accessibilityRole={'button'}
      accessibilityState={{ busy: props.busy, disabled: props.busy || props.clean }}
      disabled={props.busy || props.clean}
      onPress={props.onSave}
      style={[styles.saveBtn, props.clean && styles.footerSaved]}
    >
      <Text style={[styles.footerSecondaryText, props.clean && styles.footerSavedText]}>{label}</Text>
    </Pressable>
  );
}

export function ExerciseSessionFooter(props: {
  busy: boolean;
  finishing: boolean;
  onFinish: () => void;
  onOpenHistory?: () => void;
  readOnly?: boolean;
  t: TFunction;
  workoutElapsed?: string;
}): React.JSX.Element {
  return (
    <View style={styles.footer}>
      {props.onOpenHistory ? (
        <Pressable
          accessibilityLabel={props.t('mobile.client.session.previousDays')}
          accessibilityRole={'button'}
          onPress={props.onOpenHistory}
          style={styles.footerBtn}
        >
          <Text style={styles.footerSecondaryText}>{props.t('mobile.client.session.previousDays')}</Text>
        </Pressable>
      ) : null}
      {props.readOnly ? null : (
        <Pressable
          accessibilityLabel={props.t('mobile.client.session.finishExercise')}
          accessibilityRole={'button'}
          accessibilityState={{ busy: props.finishing || props.busy, disabled: props.finishing || props.busy }}
          disabled={props.finishing || props.busy}
          onPress={props.onFinish}
          style={[styles.footerBtn, styles.footerPrimary]}
        >
          <Text style={styles.footerPrimaryText}>{props.t('mobile.client.session.finishExercise')}</Text>
        </Pressable>
      )}
      {props.workoutElapsed ? <Text style={styles.timer}>{props.workoutElapsed}</Text> : null}
    </View>
  );
}

function SetColumnCell(props: {
  column: SetColumn;
  draft: string;
  onChange: (value: string) => void;
  onFocus: (node: number) => void;
  onOpenRom: () => void;
  readOnly?: boolean;
  t: TFunction;
  target: string;
}): React.JSX.Element {
  const label = props.t(props.column.labelKey);
  const romLabel = isRomScaleValue(props.draft) ? props.t(`mobile.client.exercise.rom.${props.draft}`) : props.draft;
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <Text style={styles.targetValue}>{props.target}</Text>
      {props.column.scale === 'rom' ? (
        <Pressable
          accessibilityLabel={label}
          accessibilityRole={'button'}
          accessibilityState={{ disabled: props.readOnly }}
          disabled={props.readOnly}
          onPress={props.onOpenRom}
          style={styles.input}
        >
          <Text style={styles.inputText}>{romLabel || '-'}</Text>
        </Pressable>
      ) : (
        <TextInput
          accessibilityLabel={label}
          editable={!props.readOnly}
          keyboardType={keyboardForField(props.column.key, props.column.minutes)}
          onChangeText={(value) => props.onChange(sanitizeSessionNumber(props.column.key, value, props.column.minutes))}
          onFocus={(event) => props.onFocus(Number(event.nativeEvent.target))}
          style={styles.input}
          value={props.draft}
        />
      )}
    </View>
  );
}

function ActionButton(props: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  surface: string;
  tint: string;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole={'button'}
      onPress={props.onPress}
      style={[styles.actionCard, { backgroundColor: props.surface }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: props.tint }]}>{props.icon}</View>
      <Text numberOfLines={2} style={[styles.actionLabel, { color: props.tint }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function CommentGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'} fill={LIGHT.textOnNavy} />
    </Svg>
  );
}

function VideoGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M8 6.5v11l10-5.5L8 6.5z'} fill={LIGHT.textOnNavy} />
    </Svg>
  );
}

function NotesGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'} fill={LIGHT.textOnNavy} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  column: { flexBasis: 0, flexGrow: 1, minWidth: 56 },
  columnLabel: {
    color: LIGHT.accentMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  targetValue: {
    color: LIGHT.textStrong,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  input: { ...SESSION.input, fontSize: 16, justifyContent: 'center', minHeight: HIT },
  inputText: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  restBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusFull,
    justifyContent: 'center',
    minHeight: HIT,
    minWidth: 112,
    paddingHorizontal: 14,
  },
  restBtnDone: { backgroundColor: LIGHT.bgSoft },
  restBtnText: { color: LIGHT.success, fontSize: 14, fontWeight: '700' },
  restBtnTextDone: { color: LIGHT.textMuted },
  actionBar: { flexDirection: 'row', gap: 8, paddingBottom: 8, paddingHorizontal: 16 },
  actionCard: {
    alignItems: 'center',
    borderRadius: LIGHT.radiusLg,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: HIT,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  actionIcon: { alignItems: 'center', borderRadius: 14, height: 36, justifyContent: 'center', width: 36 },
  actionLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  footer: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  footerBtn: {
    alignItems: 'center',
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    justifyContent: 'center',
    minHeight: HIT,
    paddingHorizontal: 6,
  },
  footerPrimary: { backgroundColor: LIGHT.accent },
  footerPrimaryText: { color: LIGHT.textOnNavy, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  footerSaved: { backgroundColor: LIGHT.emeraldSoft },
  footerSavedText: { color: LIGHT.success },
  footerSecondaryText: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  timer: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center', minWidth: 64 },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    justifyContent: 'center',
    minHeight: HIT,
    paddingHorizontal: 12,
  },
});
