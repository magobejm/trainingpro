import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ClientManagementSection } from '../../domain/client-management-section';
import {
  CLIENTS_REPOSITORY,
  type ClientsRepositoryPort,
} from '../../domain/clients-repository.port';

@Injectable()
export class SaveClientManagementSectionsUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(
    context: AuthContext,
    clientId: string,
    items: ClientManagementSection[],
  ): Promise<ClientManagementSection[]> {
    return this.repository.saveClientManagementSections(context, clientId, items);
  }
}
