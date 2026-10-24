import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ClientMeasurement } from '../../domain/client-measurement';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class ListClientMeasurementsUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string): Promise<ClientMeasurement[]> {
    return this.repository.listMeasurements(context, clientId);
  }
}
