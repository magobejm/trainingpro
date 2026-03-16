export type MobilityCreateFormState = {
  description: string;
  mediaUrl: string;
  mobilityType: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_MOBILITY_FORM: MobilityCreateFormState = {
  description: '',
  mediaUrl: '',
  mobilityType: 'undefined',
  name: '',
  youtubeUrl: '',
};
