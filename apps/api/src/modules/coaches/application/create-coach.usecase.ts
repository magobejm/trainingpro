import { Inject, Injectable } from '@nestjs/common';
import {
  COACH_ADMIN_REPOSITORY,
  type CoachAdminRepositoryPort,
  type CoachAdminView,
  type CreateCoachInput,
} from '../domain/coach-admin.repository.port';

@Injectable()
export class CreateCoachUseCase {
  constructor(
    @Inject(COACH_ADMIN_REPOSITORY)
    private readonly repository: CoachAdminRepositoryPort,
  ) {}

  execute(adminSupabaseUid: string, input: CreateCoachInput): Promise<CoachAdminView> {
    return this.repository.createCoach(adminSupabaseUid, input);
  }
}
