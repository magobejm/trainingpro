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
    background: '#ffffff',
    surface: '#f6f9ff',
    primary: '#1c74e9',
    text: '#111418',
    textSecondary: '#5e7088',
    border: '#d4e0ef',
    danger: '#d92d20',
  },
  borderRadius: {
    md: 10,
    lg: 16,
  },
};
