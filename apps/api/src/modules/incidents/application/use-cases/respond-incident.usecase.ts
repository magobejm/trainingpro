import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { INCIDENTS_REPOSITORY, type IncidentsRepositoryPort } from '../../domain/incidents.repository.port';

@Injectable()
export class RespondIncidentUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidentsRepository: IncidentsRepositoryPort,
  ) {}

  execute(context: AuthContext, incidentId: string, response: string) {
    return this.incidentsRepository.addCoachResponse(context, incidentId, response);
  }
}
