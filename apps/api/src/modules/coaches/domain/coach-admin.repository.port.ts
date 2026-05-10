export type CoachAdminView = {
  archivedAt: null | string;
  coachMembershipId: string;
  email: string;
  isActive: boolean;
  userId: string;
};

export type CreateCoachInput = {
  email: string;
  supabaseUid: string;
};

export type CreateCoachOutput = {
  coach: CoachAdminView;
  credentials: {
    temporaryPassword: null | string;
    userCreated: boolean;
  };
};

export type CoachAdminRepositoryPort = {
  activateCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  archiveCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  createCoach: (adminSupabaseUid: string, input: CreateCoachInput) => Promise<CoachAdminView>;
  deactivateCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
  listArchivedCoaches: (adminSupabaseUid: string) => Promise<CoachAdminView[]>;
  listCoaches: (adminSupabaseUid: string) => Promise<CoachAdminView[]>;
  restoreCoach: (adminSupabaseUid: string, coachMembershipId: string) => Promise<CoachAdminView>;
};

export const COACH_ADMIN_REPOSITORY = Symbol('COACH_ADMIN_REPOSITORY');
