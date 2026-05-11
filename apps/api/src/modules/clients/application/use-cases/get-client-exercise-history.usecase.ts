import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../../sessions/domain/sessions-repository.port';
import type { ExerciseHistoryEntry } from '../../../sessions/domain/session.entity';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class GetClientExerciseHistoryUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepositoryPort,
  ) {}

  async execute(context: AuthContext, sourceExerciseId: string, limit = 3): Promise<ExerciseHistoryEntry[]> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const client = await this.clientsRepository.findClientByEmail(email);
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return this.sessionsRepository.findExerciseHistory(client.id, sourceExerciseId, limit);
  }
}
