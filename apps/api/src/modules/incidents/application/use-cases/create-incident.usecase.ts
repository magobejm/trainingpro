import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { EmitIncidentCriticalEventUseCase } from '../../../notifications/application/use-cases/emit-incident-critical-event.usecase';
import { INCIDENTS_REPOSITORY, type IncidentsRepositoryPort } from '../../domain/incidents.repository.port';
import type { CreateIncidentInput } from '../../domain/incident.input';

@Injectable()
export class CreateIncidentUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidentsRepository: IncidentsRepositoryPort,
    private readonly emitIncidentCriticalEventUseCase: EmitIncidentCriticalEventUseCase,
  ) {}

  async execute(context: AuthContext, input: CreateIncidentInput) {
    const incident = await this.incidentsRepository.createIncident(context, input);
    if (incident.severity === 'CRITICAL') {
      await this.emitIncidentCriticalEventUseCase.execute(incident.id);
    }
    return incident;
  }
}
