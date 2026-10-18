import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ListClientsQuery } from '../../domain/list-clients.query';
import type { Client } from '../../domain/client';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, query?: ListClientsQuery): Promise<Client[]> {
    return query ? this.repository.listClientsByCoach(context, query) : this.repository.listClientsByCoach(context);
  }

  executePage(context: AuthContext, query: ListClientsQuery & { limit: number }) {
    return this.repository.listClientsPage(context, query);
  }
}
