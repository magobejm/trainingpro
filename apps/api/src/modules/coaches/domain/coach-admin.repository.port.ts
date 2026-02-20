export type CoachAdminView = {
  coachMembershipId: string;
  email: string;
  isActive: boolean;
  userId: string;
};

export type CreateCoachInput = {
  email: string;
  supabaseUid: string;
};

export type CoachAdminRepositoryPort = {
  activateCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  archiveCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  createCoach: (adminSupabaseUid: string, input: CreateCoachInput) => Promise<CoachAdminView>;
  deactivateCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  listCoaches: (adminSupabaseUid: string) => Promise<CoachAdminView[]>;
};

export const COACH_ADMIN_REPOSITORY = Symbol('COACH_ADMIN_REPOSITORY');
