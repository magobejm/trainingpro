import type { BlockType } from '../../RoutinePlanner.types';

export const DEFAULT_PICKER_BLOCK_TYPES: BlockType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'mobility'];

export interface LibraryItem {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  muscleGroup?: string;
  methodType?: string;
  equipment?: null | string;
  imageUrl: string | null;
  youtubeUrl: string | null;
}

export interface PickerProps {
  allowedTypes?: BlockType[];
  blockType: BlockType | null;
  onCancel: () => void;
  onSelect: (libraryId: string, displayName: string, type: BlockType) => void;
  t: (k: string, options?: { count: number }) => string;
}
