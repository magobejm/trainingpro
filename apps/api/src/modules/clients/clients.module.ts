import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { ArchiveClientUseCase } from './application/use-cases/archive-client.usecase';
import { ClientAuthProvisionerService } from './application/services/client-auth-provisioner.service';
import { CreateClientUseCase } from './application/use-cases/create-client.usecase';
import { GetClientUseCase } from './application/use-cases/get-client.usecase';
import { GetClientManagementSectionsUseCase } from './application/use-cases/get-client-management-sections.usecase';
import { ListClientsUseCase } from './application/use-cases/list-clients.usecase';
import { ListClientObjectivesUseCase } from './application/use-cases/list-client-objectives.usecase';
import { ResetClientPasswordUseCase } from './application/use-cases/reset-client-password.usecase';
import { SaveClientManagementSectionsUseCase } from './application/use-cases/save-client-management-sections.usecase';
import { UpdateClientUseCase } from './application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from './application/use-cases/upload-client-avatar.usecase';
import { CLIENTS_REPOSITORY } from './domain/clients-repository.port';
import { ClientAccessPolicy } from './domain/policies/client-access.policy';
import { ClientRepositoryPrisma } from './infra/prisma/client.repository.prisma';
import { ClientsController } from './presentation/controllers/clients.controller';
import { ClientOwnershipGuard } from './presentation/guards/client-ownership.guard';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [ClientsController],
  providers: [
    ArchiveClientUseCase,
    ClientAuthProvisionerService,
    CreateClientUseCase,
    GetClientUseCase,
    GetClientManagementSectionsUseCase,
    ListClientsUseCase,
    ListClientObjectivesUseCase,
    ResetClientPasswordUseCase,
    SaveClientManagementSectionsUseCase,
    UpdateClientUseCase,
    UploadClientAvatarUseCase,
    ClientAccessPolicy,
    ClientOwnershipGuard,
    ClientRepositoryPrisma,
    {
      provide: CLIENTS_REPOSITORY,
      useExisting: ClientRepositoryPrisma,
    },
  ],
})
export class ClientsModule {}
