import React from 'react';
import { Image, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { getFullUrl } from '../RoutinePlanner/ExercisePickerModal.utils';
import { useUnifiedExercisesQuery } from '../../../../data/hooks/useUnifiedLibraryQuery';

const RESIZE_MODE_COVER = 'cover' as const;

export function RoutineBlockImage({ block }: { block: Pick<DraftBlock, 'type' | 'libraryId'> }): React.JSX.Element {
  const { data: library = [] } = useUnifiedExercisesQuery({});
  const exercise = library.find((item) => item.id === block.libraryId);
  const imageUrl = getFullUrl(block.type, exercise?.mediaUrl);
  return (
    <View style={s.blockImageWrap}>
      <Image resizeMode={RESIZE_MODE_COVER} source={{ uri: imageUrl }} style={s.blockBodyImage} />
    </View>
  );
}
