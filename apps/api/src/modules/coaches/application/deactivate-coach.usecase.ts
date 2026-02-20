import { Inject, Injectable } from '@nestjs/common';
import {
  COACH_ADMIN_REPOSITORY,
  type CoachAdminRepositoryPort,
  type CoachAdminView,
} from '../domain/coach-admin.repository.port';

@Injectable()
export class DeactivateCoachUseCase {
  constructor(
    @Inject(COACH_ADMIN_REPOSITORY)
    private readonly repository: CoachAdminRepositoryPort,
  ) {}

  execute(adminSupabaseUid: string, coachMembershipId: string): Promise<CoachAdminView> {
    return this.repository.deactivateCoach(adminSupabaseUid, coachMembershipId);
  }
}
