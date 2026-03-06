import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import {
  CLIENTS_REPOSITORY,
  type ClientsRepositoryPort,
} from '../../domain/clients-repository.port';

@Injectable()
export class ListClientProgressPhotosUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string): Promise<ClientProgressPhoto[]> {
    return this.repository.listProgressPhotos(context, clientId);
  }
}
