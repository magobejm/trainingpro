export type ClientCreateInput = {
  avatarUrl?: null | string;
  birthDate?: Date | null;
  clientSupabaseUid?: string;
  email: string;
  firstName: string;
  heightCm?: number | null;
  lastName: string;
  notes?: null | string;
  objectiveId?: null | string;
  phone?: null | string;
  sex?: null | string;
  weightKg?: number | null;
};
