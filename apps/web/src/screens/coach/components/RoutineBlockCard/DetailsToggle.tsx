import React from 'react';
import { Button } from '@trainerpro/ui';

interface DetailsToggleProps {
  show: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}

export function DetailsToggle({ show, onToggle, t }: DetailsToggleProps) {
  const label = show ? t('coach.routine.hideDetails') : t('coach.routine.showDetails');
  return <Button label={label} onPress={onToggle} size="sm" variant="ghost" />;
}
