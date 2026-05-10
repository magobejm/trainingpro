import { Inject, Injectable } from '@nestjs/common';
import {
  COACH_ADMIN_REPOSITORY,
  type CoachAdminRepositoryPort,
  type CreateCoachOutput,
} from '../domain/coach-admin.repository.port';
import { CoachAuthProvisionerService } from './services/coach-auth-provisioner.service';

@Injectable()
export class CreateCoachUseCase {
  constructor(
    @Inject(COACH_ADMIN_REPOSITORY)
    private readonly repository: CoachAdminRepositoryPort,
    private readonly provisioner: CoachAuthProvisionerService,
  ) {}

  async execute(adminSupabaseUid: string, input: { email: string }): Promise<CreateCoachOutput> {
    const authUser = await this.provisioner.ensureCoachAuthUser(input.email);
    const coach = await this.repository.createCoach(adminSupabaseUid, {
      email: input.email,
      supabaseUid: authUser.userId,
    });
    return {
      coach,
      credentials: {
        temporaryPassword: authUser.temporaryPassword,
        userCreated: authUser.created,
      },
    };
  }
}
