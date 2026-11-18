import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Modal, TextField, colors, fontSize, space, useToast } from '@trainerpro/ui';
import { useCopyLibraryItemMutation, type CopyTarget } from '../../../data/hooks/useCopyLibraryItem';

const NAME_MAX = 120;

type Props = { onClose: () => void; target: CopyTarget | null };

/** Asks for a new name and creates a copy owned by the current coach. */
export function CopyItemModal({ onClose, target }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const copy = useCopyLibraryItemMutation();
  const [name, setName] = useState('');
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (!target) return;
    setName(t('coach.library.copy.defaultName', { name: target.name }).slice(0, NAME_MAX));
    setError(null);
  }, [target, t]);

  const submit = () => {
    if (!target) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('coach.library.copy.nameRequired'));
      return;
    }
    copy.mutate(
      { name: trimmed, target },
      {
        onError: () => setError(t('coach.library.copy.failed')),
        onSuccess: () => {
          toast.show(trimmed, 'success');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      closeLabel={t('common.cancel')}
      footer={
        <>
          <Button disabled={copy.isPending} label={t('common.cancel')} onPress={onClose} variant="secondary" />
          <Button label={t('coach.library.copy.confirm')} loading={copy.isPending} onPress={submit} />
        </>
      }
      onClose={onClose}
      size="sm"
      title={t('coach.library.copy.title')}
      visible={Boolean(target)}
    >
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginBottom: space.md }}>
        {t('coach.library.copy.hint')}
      </Text>
      <TextField
        autoFocus
        error={error}
        label={t('coach.library.copy.nameLabel')}
        maxLength={NAME_MAX}
        onChangeText={(value) => {
          setName(value);
          setError(null);
        }}
        onSubmitEditing={submit}
        value={name}
      />
    </Modal>
  );
}
