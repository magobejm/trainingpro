import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { INCIDENTS_REPOSITORY, type IncidentsRepositoryPort } from '../../domain/incidents.repository.port';
import type { IncidentListQuery } from '../../domain/incident.input';

@Injectable()
export class ListIncidentsUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidentsRepository: IncidentsRepositoryPort,
  ) {}

  execute(context: AuthContext, query: IncidentListQuery) {
    return this.incidentsRepository.listIncidents(context, query);
  }
}
