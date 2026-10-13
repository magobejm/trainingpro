import { ExerciseCategory, UnifiedExerciseItem } from './hooks/useUnifiedExerciseForm';

export interface UnifiedExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  itemToEdit?: UnifiedExerciseItem | null;
  defaultCategory?: ExerciseCategory;
}

export interface SelectOption {
  label: string;
  value: string;
}

export const MODAL_THEME = {
  colors: {
    background: 'var(--tp-surface)',
    surface: 'var(--tp-background)',
    primary: 'var(--tp-primary)',
    text: 'var(--tp-text)',
    textSecondary: 'var(--tp-textMuted)',
    border: 'var(--tp-border)',
    danger: 'var(--tp-danger)',
  },
  borderRadius: {
    md: 10,
    lg: 16,
  },
};
