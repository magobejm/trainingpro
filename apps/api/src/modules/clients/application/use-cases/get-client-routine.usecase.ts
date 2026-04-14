import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';
import type { ClientRoutine } from '../../domain/client-routine';

@Injectable()
export class GetClientRoutineUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  async execute(context: AuthContext): Promise<ClientRoutine> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const routine = await this.repository.findClientRoutineByEmail(email);
    if (!routine) {
      throw new NotFoundException('No routine assigned to this client');
    }
    return routine;
  }
}
