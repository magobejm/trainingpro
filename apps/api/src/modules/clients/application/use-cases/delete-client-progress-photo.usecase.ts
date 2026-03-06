import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  CLIENTS_REPOSITORY,
  type ClientsRepositoryPort,
} from '../../domain/clients-repository.port';

@Injectable()
export class DeleteClientProgressPhotoUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string, photoId: string): Promise<void> {
    return this.repository.deleteProgressPhoto(context, clientId, photoId);
  }
}
