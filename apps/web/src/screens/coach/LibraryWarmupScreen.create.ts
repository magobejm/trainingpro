export type WarmupCreateFormState = {
  description: string;
  mediaUrl: string;
  name: string;
  notes: string;
  youtubeUrl: string;
};

export const EMPTY_WARMUP_FORM: WarmupCreateFormState = {
  description: '',
  mediaUrl: '',
  name: '',
  notes: '',
  youtubeUrl: '',
};
