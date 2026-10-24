import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ClientProgressPhoto, ProgressPhotoMeta } from '../../domain/client-progress-photo';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class CreateClientProgressPhotoUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string, imageUrl: string, meta?: ProgressPhotoMeta): Promise<ClientProgressPhoto> {
    if (!meta) return this.repository.createProgressPhoto(context, clientId, imageUrl);
    return this.repository.createProgressPhoto(context, clientId, imageUrl, meta);
  }
}
