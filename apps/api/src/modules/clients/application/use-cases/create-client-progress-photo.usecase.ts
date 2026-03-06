import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import {
  CLIENTS_REPOSITORY,
  type ClientsRepositoryPort,
} from '../../domain/clients-repository.port';

@Injectable()
export class CreateClientProgressPhotoUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string, imageUrl: string): Promise<ClientProgressPhoto> {
    return this.repository.createProgressPhoto(context, clientId, imageUrl);
  }
}
