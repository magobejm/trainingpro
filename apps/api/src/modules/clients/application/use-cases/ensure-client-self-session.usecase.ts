import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../../sessions/domain/sessions-repository.port';
import type { SessionInstance } from '../../../sessions/domain/session.entity';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

export type EnsureClientSelfSessionInput = {
  sessionDate: Date;
  planDayId?: string;
};

@Injectable()
export class EnsureClientSelfSessionUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepositoryPort,
  ) {}

  async execute(context: AuthContext, input: EnsureClientSelfSessionInput): Promise<SessionInstance> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const client = await this.clientsRepository.findClientByEmail(email);
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }

    let templateId = client.trainingPlanId;
    if (input.planDayId) {
      const calendarTemplateId = await this.clientsRepository.findClientPlanDayTemplateIdByEmail(email, input.planDayId);
      if (calendarTemplateId) {
        templateId = calendarTemplateId;
      }
    }

    if (!templateId) {
      throw new ConflictException('No training plan assigned');
    }

    return this.sessionsRepository.ensureSessionForClient(context, {
      clientId: client.id,
      templateId,
      planDayId: input.planDayId,
      sessionDate: input.sessionDate,
      coachMembershipId: client.coachMembershipId,
      organizationId: client.organizationId,
    });
  }
}
