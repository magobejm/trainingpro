import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientExerciseCard } from '@trainerpro/ui';
import type { ClientRoutineExercise } from '../../data/hooks/useClientRoutineQuery';
import { YouTubeVideoModal } from '../../components/YouTubeVideoModal';
import { BlurredImageFrame } from '../../components/BlurredImageFrame';
import { getFullMediaUrl } from '../../utils/library-media.helpers';
import { ExerciseInstructionsModal } from './ExerciseInstructionsModal';

type ExerciseCardProps = { exercise: ClientRoutineExercise; expanded: boolean; onToggle: () => void };
export function ExerciseCard(props: ExerciseCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const { exercise } = props;
  return (
    <>
      <ClientExerciseCard
        {...props}
        t={t}
        media={<BlurredImageFrame imageUri={getFullMediaUrl(exercise.type, exercise.mediaUrl)} />}
        onInstructions={() => setInstructionsOpen(true)}
        onTrainerNote={() => setNoteOpen(true)}
        onVideo={() => setVideoOpen(true)}
      />
      <ExerciseInstructionsModal
        instructions={exercise.coachInstructions}
        title={t('client.notes.exerciseInstructions')}
        visible={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />
      <ExerciseInstructionsModal
        emptyKey={'mobile.client.exercise.trainerNoteEmpty'}
        instructions={exercise.notes}
        title={t('client.notes.trainerNote')}
        visible={noteOpen}
        onClose={() => setNoteOpen(false)}
      />
      <YouTubeVideoModal
        title={exercise.displayName}
        visible={videoOpen}
        youtubeUrl={exercise.youtubeUrl}
        onClose={() => setVideoOpen(false)}
      />
    </>
  );
}
