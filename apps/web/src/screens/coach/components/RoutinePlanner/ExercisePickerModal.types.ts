import type { BlockType } from '../../RoutinePlanner.types';

export interface LibraryItem {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  youtubeUrl: string | null;
}

export interface PickerProps {
  blockType: BlockType | null;
  onCancel: () => void;
  onSelect: (libraryId: string, displayName: string) => void;
  t: (k: string) => string;
}
