import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';
import type { ClientRoutineDay } from '../../domain/client-routine';

@Injectable()
export class GetClientPlanDayUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  async execute(context: AuthContext, planDayId: string, on?: string): Promise<ClientRoutineDay> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const planDay = await this.repository.presentClientPlanDay(email, planDayId, planDayDate(on));
    if (!planDay) {
      throw new NotFoundException('Plan day not found');
    }
    return planDay;
  }
}

function planDayDate(on?: string): Date {
  if (on && /^\d{4}-\d{2}-\d{2}$/.test(on)) return new Date(`${on}T00:00:00.000Z`);
  return new Date();
}
