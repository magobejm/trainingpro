export type SportCreateFormState = {
  description: string;
  mediaUrl: string;
  name: string;
};

export const EMPTY_SPORT_FORM: SportCreateFormState = {
  description: '',
  mediaUrl: '',
  name: '',
};
