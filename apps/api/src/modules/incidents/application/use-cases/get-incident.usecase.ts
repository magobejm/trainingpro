import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { IncidentView } from '../../domain/incident.entity';
import { INCIDENTS_REPOSITORY, type IncidentsRepositoryPort } from '../../domain/incidents.repository.port';

@Injectable()
export class GetIncidentUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidentsRepository: IncidentsRepositoryPort,
  ) {}

  execute(context: AuthContext, incidentId: string): Promise<IncidentView> {
    return this.incidentsRepository.getIncident(context, incidentId);
  }
}
