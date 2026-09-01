import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ArchiveClientUseCase } from './application/use-cases/archive-client.usecase';
import { EnsureClientSelfSessionUseCase } from './application/use-cases/ensure-client-self-session.usecase';
import { GetClientCalendarSummaryUseCase } from './application/use-cases/get-client-calendar-summary.usecase';
import { GetClientExerciseHistoryUseCase } from './application/use-cases/get-client-exercise-history.usecase';
import { ListClientLibraryCardioUseCase } from './application/use-cases/list-client-library-cardio.usecase';
import { ListClientLibraryExercisesUseCase } from './application/use-cases/list-client-library-exercises.usecase';
import { ListClientLibraryIsometricUseCase } from './application/use-cases/list-client-library-isometric.usecase';
import { ListClientLibraryMobilityUseCase } from './application/use-cases/list-client-library-mobility.usecase';
import { ListClientLibraryPlioUseCase } from './application/use-cases/list-client-library-plio.usecase';
import { ListClientLibrarySportsUseCase } from './application/use-cases/list-client-library-sports.usecase';
import { ListClientCalendarUseCase } from './application/use-cases/list-client-calendar.usecase';
import { ListClientSessionsUseCase } from './application/use-cases/list-client-sessions.usecase';
import { ListClientWellnessUseCase } from './application/use-cases/list-client-wellness.usecase';
import { ClientAuthProvisionerService } from './application/services/client-auth-provisioner.service';
import { CreateClientProgressPhotoUseCase } from './application/use-cases/create-client-progress-photo.usecase';
import { CreateClientUseCase } from './application/use-cases/create-client.usecase';
import { DeleteClientProgressPhotoUseCase } from './application/use-cases/delete-client-progress-photo.usecase';
import { GetClientUseCase } from './application/use-cases/get-client.usecase';
import { GetClientManagementSectionsUseCase } from './application/use-cases/get-client-management-sections.usecase';
import { GetClientMeUseCase } from './application/use-cases/get-client-me.usecase';
import { GetClientPlanDayUseCase } from './application/use-cases/get-client-plan-day.usecase';
import { GetClientRoutineUseCase } from './application/use-cases/get-client-routine.usecase';
import { ListClientProgressPhotosUseCase } from './application/use-cases/list-client-progress-photos.usecase';
import { ListClientsUseCase } from './application/use-cases/list-clients.usecase';
import { ListClientObjectivesUseCase } from './application/use-cases/list-client-objectives.usecase';
import { ResetClientPasswordUseCase } from './application/use-cases/reset-client-password.usecase';
import { SaveClientManagementSectionsUseCase } from './application/use-cases/save-client-management-sections.usecase';
import { SetClientProgressPhotoArchivedUseCase } from './application/use-cases/set-client-progress-photo-archived.usecase';
import { UpdateClientUseCase } from './application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from './application/use-cases/upload-client-avatar.usecase';
import { UploadClientProgressPhotoUseCase } from './application/use-cases/upload-client-progress-photo.usecase';
import { CLIENTS_REPOSITORY } from './domain/clients-repository.port';
import { ClientAccessPolicy } from './domain/policies/client-access.policy';
import { ClientRepositoryPrisma } from './infra/prisma/client.repository.prisma';
import { ClientLibraryController } from './presentation/controllers/client-library.controller';
import { ClientSelfController } from './presentation/controllers/client-self.controller';
import { ClientsController } from './presentation/controllers/clients.controller';
import { ClientOwnershipGuard } from './presentation/guards/client-ownership.guard';

@Module({
  imports: [AuthModule, FilesModule, SessionsModule],
  controllers: [ClientLibraryController, ClientSelfController, ClientsController],
  providers: [
    ArchiveClientUseCase,
    EnsureClientSelfSessionUseCase,
    GetClientCalendarSummaryUseCase,
    GetClientExerciseHistoryUseCase,
    ListClientLibraryCardioUseCase,
    ListClientLibraryExercisesUseCase,
    ListClientLibraryIsometricUseCase,
    ListClientLibraryMobilityUseCase,
    ListClientLibraryPlioUseCase,
    ListClientLibrarySportsUseCase,
    ListClientCalendarUseCase,
    ListClientSessionsUseCase,
    ListClientWellnessUseCase,
    ClientAuthProvisionerService,
    CreateClientProgressPhotoUseCase,
    CreateClientUseCase,
    DeleteClientProgressPhotoUseCase,
    GetClientUseCase,
    GetClientManagementSectionsUseCase,
    GetClientMeUseCase,
    GetClientPlanDayUseCase,
    GetClientRoutineUseCase,
    ListClientProgressPhotosUseCase,
    ListClientsUseCase,
    ListClientObjectivesUseCase,
    ResetClientPasswordUseCase,
    SaveClientManagementSectionsUseCase,
    SetClientProgressPhotoArchivedUseCase,
    UpdateClientUseCase,
    UploadClientAvatarUseCase,
    UploadClientProgressPhotoUseCase,
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
