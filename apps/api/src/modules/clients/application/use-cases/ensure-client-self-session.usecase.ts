import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../../sessions/domain/sessions-repository.port';
import type { SessionInstance } from '../../../sessions/domain/session.entity';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';
import {
  ClientCalendarPlanDaySwapService,
  DayChangeConfirmationRequiredError,
} from '../services/client-calendar-plan-day-swap.service';

export type EnsureClientSelfSessionInput = {
  confirmDayChange?: boolean;
  planDayId?: string;
  sessionDate: Date;
};

@Injectable()
export class EnsureClientSelfSessionUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepositoryPort,
    private readonly calendarPlanDaySwapService: ClientCalendarPlanDaySwapService,
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

    if (input.planDayId) {
      const swapInput = {
        clientId: client.id,
        coachMembershipId: client.coachMembershipId,
        requestedPlanDayId: input.planDayId,
        sessionDate: input.sessionDate,
      };
      const needsSwap = await this.calendarPlanDaySwapService.needsSwap(swapInput);
      if (needsSwap && !input.confirmDayChange) {
        throw new DayChangeConfirmationRequiredError();
      }
      if (needsSwap && input.confirmDayChange) {
        await this.calendarPlanDaySwapService.execute(context, swapInput);
      }
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
