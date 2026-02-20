export type CardioMethodFilter = {
  methodTypeId?: string;
  query?: string;
};

export type CardioMethodWriteInput = {
  description?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  youtubeUrl?: null | string;
  methodTypeId: string;
  name: string;
};
