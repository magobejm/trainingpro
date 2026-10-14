import React from 'react';
import { Text, View } from 'react-native';
import { Lock } from 'lucide-react';
import { Button, TextField, colors, space } from '@trainerpro/ui';
import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
} from './NotesScreen.layout-styles';

export const GENERAL_NOTE_FIELD = 'coach-notes-general';

type GeneralNoteSectionProps = {
  focusGeneral?: boolean;
  value: string;
  onChange: (v: string) => void;
  isSaving?: boolean;
  onSave: () => void;
  t: (k: string) => string;
};

const generalCardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: 'hidden' as const,
};

const generalFooterStyle = {
  padding: space.lg,
  borderTopWidth: 1,
  borderColor: colors.border,
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
};

export function GeneralNoteSection(props: GeneralNoteSectionProps): React.JSX.Element {
  const { focusGeneral, value, onChange, isSaving, onSave, t } = props;
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  const layoutStyle5 = getLayoutStyle5;
  return (
    <View style={layoutStyle1}>
      <View style={layoutStyle2}>
        <View style={layoutStyle3}>
          <Lock color={colors.textMuted} size={20} />
        </View>
        <Text style={layoutStyle4}>{t('coach.notes.private.title')}</Text>
      </View>
      <View style={generalCardStyle}>
        <View style={layoutStyle5}>
          <TextField
            accessibilityLabel={t('coach.notes.private.title')}
            autoFocus={focusGeneral}
            multiline
            nativeID={GENERAL_NOTE_FIELD}
            numberOfLines={8}
            onChangeText={onChange}
            placeholder={t('coach.notes.private.placeholder')}
            value={value}
          />
        </View>
        <View style={generalFooterStyle}>
          <Button label={t('coach.notes.save')} loading={isSaving} onPress={onSave} />
        </View>
      </View>
    </View>
  );
}
