export type PlioCreateFormState = {
  description: string;
  equipment: string;
  mediaUrl: string;
  name: string;
  plioType: string;
  youtubeUrl: string;
};

export const EMPTY_PLIO_FORM: PlioCreateFormState = {
  description: '',
  equipment: '',
  mediaUrl: '',
  name: '',
  plioType: 'undefined',
  youtubeUrl: '',
};
