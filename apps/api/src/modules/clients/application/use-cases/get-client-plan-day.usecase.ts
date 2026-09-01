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

  async execute(context: AuthContext, planDayId: string): Promise<ClientRoutineDay> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const planDay = await this.repository.findClientPlanDayByEmail(email, planDayId);
    if (!planDay) {
      throw new NotFoundException('Plan day not found');
    }
    return planDay;
  }
}
