export type WarmupCreateFormState = {
  description: string;
  mediaUrl: string;
  mobilityType: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_WARMUP_FORM: WarmupCreateFormState = {
  description: '',
  mediaUrl: '',
  mobilityType: 'undefined',
  name: '',
  youtubeUrl: '',
};
