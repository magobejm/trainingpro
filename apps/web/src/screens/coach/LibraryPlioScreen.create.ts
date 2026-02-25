export type PlioCreateFormState = {
  description: string;
  mediaUrl: string;
  name: string;
  notes: string;
  youtubeUrl: string;
};

export const EMPTY_PLIO_FORM: PlioCreateFormState = {
  description: '',
  mediaUrl: '',
  name: '',
  notes: '',
  youtubeUrl: '',
};
