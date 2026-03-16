export type IsometricCreateFormState = {
  description: string;
  equipment: string;
  isometricType: string;
  mediaUrl: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_ISOMETRIC_FORM: IsometricCreateFormState = {
  description: '',
  equipment: '',
  isometricType: 'undefined',
  mediaUrl: '',
  name: '',
  youtubeUrl: '',
};
