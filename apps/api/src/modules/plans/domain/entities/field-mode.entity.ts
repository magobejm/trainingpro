export type FieldModeValue = 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN';

export type FieldModeEntry = {
  fieldKey: string;
  mode: FieldModeValue;
};
