import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ClientExerciseCard,
  ClientRoutineDayContent,
  Modal,
  colors,
  clientPlanLight as LIGHT,
} from '@trainerpro/ui';
import { type ClientRoutine, type ClientRoutineExercise } from '@trainerpro/shared';

export function ClientPreviewButton(props: {
  isDraft: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        disabled={props.disabled}
        variant="secondary"
        label={t('coach.clientPreview.open')}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <Modal
          visible
          title={t('coach.clientPreview.title')}
          closeLabel={t('common.close')}
          onClose={() => setOpen(false)}
          size="md"
        >
          <Text style={styles.notice}>{t('coach.clientPreview.readOnly')}</Text>
          {props.isDraft ? <Text style={styles.pending}>{t('coach.clientPreview.unsaved')}</Text> : null}
          <View style={styles.phone}>
            <View style={styles.speaker} />
            <ScrollView style={styles.screen}>{props.children}</ScrollView>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

export function RoutineClientPreview({ routine }: { routine: ClientRoutine }): React.JSX.Element {
  const { t } = useTranslation();
  const [dayId, setDayId] = useState<string | null>(null);
  const day = routine.planDays.find((item) => item.id === dayId);
  return (
    <View style={styles.content}>
      {day ? (
        <>
          <PhoneAction label={t('coach.clientPreview.back')} onPress={() => setDayId(null)} />
          <ClientRoutineDayContent
            key={day.id}
            day={day}
            showWarmups
            t={t}
            renderExercise={(exercise, expanded, toggle) => (
              <PreviewExercise key={exercise.id} exercise={exercise} expanded={expanded} toggle={toggle} />
            )}
          />
          {day.notes ? (
            <View style={styles.card}>
              <Text style={styles.heading}>{t('mobile.client.day.notes')}</Text>
              <Text style={styles.body}>{day.notes}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroName}>{routine.name || t('coach.clientPreview.empty')}</Text>
            <Text style={styles.heroText}>{`${routine.planDays.length} ${t('mobile.client.routine.trainingDays')}`}</Text>
            {routine.expectedCompletionDays != null ? (
              <Text
                style={styles.heroText}
              >{`${t('mobile.client.routine.mesocycle')}: ${routine.expectedCompletionDays}`}</Text>
            ) : null}
          </View>
          <Text style={styles.heading}>{t('mobile.client.routine.assignedDays')}</Text>
          {routine.planDays.map((item) => (
            <Pressable accessibilityRole="button" key={item.id} onPress={() => setDayId(item.id)} style={styles.card}>
              <Text style={styles.heading}>{item.title || t('coach.clientPreview.empty')}</Text>
              <View style={styles.dayCounts}>
                <Text style={styles.body}>{t('client.planning.exercisesCount', { count: item.exercises.length })}</Text>
                {item.warmups?.length ? (
                  <View style={styles.warmupBadge}>
                    <Text style={styles.warmupBadgeText}>
                      {t('mobile.client.warmup.badge', {
                        count: item.warmups.reduce((count, warmup) => count + warmup.exercises.length, 0),
                      })}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.body}>{'›'}</Text>
              </View>
            </Pressable>
          ))}
          {routine.neats?.length ? (
            <>
              <Text style={styles.heading}>{t('mobile.client.neat.title')}</Text>
              {routine.neats.map((neat) => (
                <View key={neat.id} style={styles.card}>
                  <Text style={styles.heading}>{neat.title}</Text>
                  {neat.description ? <Text style={styles.body}>{neat.description}</Text> : null}
                </View>
              ))}
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

function PreviewExercise(props: {
  exercise: ClientRoutineExercise;
  expanded: boolean;
  toggle: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [info, setInfo] = useState<string | null>(null);
  const media = props.exercise.mediaUrl;
  const base = import.meta.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const placeholders = {
    strength: 'routine-placeholder.jpg',
    cardio: 'cardio-bg.jpg',
    mobility: 'warmup-placeholder.png',
    plio: 'plio-placeholder.png',
    sport: 'sports-placeholder.png',
    isometric: 'isometric-placeholder.png',
  };
  const uri =
    media?.startsWith('http') || media?.startsWith('data:')
      ? media
      : media
        ? `${base}${media.startsWith('/') ? '' : '/'}${media}`
        : `${base}/assets/placeholders/${placeholders[props.exercise.type]}`;
  return (
    <>
      <ClientExerciseCard
        exercise={props.exercise}
        expanded={props.expanded}
        onToggle={props.toggle}
        t={t}
        media={uri ? <Image source={{ uri }} style={styles.image} resizeMode={'contain'} /> : undefined}
        onInstructions={() => setInfo(props.exercise.coachInstructions)}
        onTrainerNote={() => setInfo(props.exercise.notes)}
        onVideo={() => setInfo(props.exercise.youtubeUrl)}
      />
      {info ? (
        <View style={styles.card}>
          <Text style={styles.body}>{info}</Text>
          <PhoneAction label={t('common.close')} onPress={() => setInfo(null)} />
        </View>
      ) : null}
    </>
  );
}

export { NutritionClientPreview } from './NutritionClientPreview';

function PhoneAction(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress} style={styles.action}>
      <Text style={styles.actionText}>{props.label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  notice: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  pending: { color: colors.warning, fontSize: 13, marginBottom: 8 },
  phone: {
    alignSelf: 'center',
    backgroundColor: LIGHT.textStrong,
    borderColor: LIGHT.textStrong,
    borderWidth: 7,
    borderRadius: 36,
    maxWidth: '100%',
    width: 390,
    overflow: 'hidden',
  },
  speaker: {
    alignSelf: 'center',
    backgroundColor: LIGHT.textMuted,
    height: 5,
    borderRadius: 8,
    marginVertical: 8,
    width: 70,
  },
  screen: { backgroundColor: LIGHT.bg, height: 620, maxHeight: '65vh' as unknown as number },
  content: { padding: 16, paddingBottom: 28 },
  nutrition: { paddingVertical: 16 },
  hero: { backgroundColor: LIGHT.bgNavy, borderRadius: 24, padding: 20, marginBottom: 20, gap: 8 },
  heroName: { color: LIGHT.textOnNavy, fontSize: 24, fontWeight: '800' },
  heroText: { color: LIGHT.textOnNavyMuted, fontSize: 13 },
  heading: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  body: { color: LIGHT.textMuted, fontSize: 13, lineHeight: 20 },
  dayCounts: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  warmupBadge: { borderColor: LIGHT.accentSoft, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  warmupBadgeText: { color: LIGHT.accentDark, fontSize: 10, fontWeight: '600' },
  action: { paddingVertical: 12, marginBottom: 8 },
  actionText: { color: LIGHT.accent, fontSize: 14, fontWeight: '700' },
  image: { height: '100%', width: '100%' },
  nutritionTitle: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginHorizontal: 16, marginBottom: 8 },
  description: { color: LIGHT.textMuted, fontSize: 13, marginHorizontal: 16, marginBottom: 12 },
});
