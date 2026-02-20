import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { Client } from '../../domain/client';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class GetClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  async execute(context: AuthContext, clientId: string): Promise<Client> {
    const client = await this.repository.getClientById(context, clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }
}
