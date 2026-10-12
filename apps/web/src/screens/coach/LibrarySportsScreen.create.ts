export type SportCreateFormState = {
  icon: string;
  description: string;
  mediaUrl: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_SPORT_FORM: SportCreateFormState = {
  icon: '🏆',
  description: '',
  mediaUrl: '',
  name: '',
  youtubeUrl: '',
};
