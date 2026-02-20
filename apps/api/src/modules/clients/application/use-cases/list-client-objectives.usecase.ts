import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENTS_REPOSITORY,
  type ClientsRepositoryPort,
} from '../../domain/clients-repository.port';

@Injectable()
export class ListClientObjectivesUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
  ) {}

  execute() {
    return this.clientsRepository.listObjectives();
  }
}
