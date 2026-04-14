import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { Client } from '../../domain/client';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class GetClientMeUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  async execute(context: AuthContext): Promise<Client> {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const client = await this.repository.findClientByEmail(email);
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return client;
  }
}
