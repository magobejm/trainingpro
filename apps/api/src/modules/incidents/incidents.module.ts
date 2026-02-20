import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AddAdjustmentDraftUseCase } from './application/use-cases/add-adjustment-draft.usecase';
import { CreateIncidentUseCase } from './application/use-cases/create-incident.usecase';
import { ListIncidentsUseCase } from './application/use-cases/list-incidents.usecase';
import { MarkIncidentReviewedUseCase } from './application/use-cases/mark-incident-reviewed.usecase';
import { RespondIncidentUseCase } from './application/use-cases/respond-incident.usecase';
import { TagIncidentUseCase } from './application/use-cases/tag-incident.usecase';
import { INCIDENTS_REPOSITORY } from './domain/incidents.repository.port';
import { IncidentsRepositoryPrisma } from './infra/prisma/incidents.repository.prisma';
import { IncidentsController } from './presentation/controllers/incidents.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [IncidentsController],
  providers: [
    AddAdjustmentDraftUseCase,
    CreateIncidentUseCase,
    ListIncidentsUseCase,
    MarkIncidentReviewedUseCase,
    RespondIncidentUseCase,
    TagIncidentUseCase,
    IncidentsRepositoryPrisma,
    {
      provide: INCIDENTS_REPOSITORY,
      useExisting: IncidentsRepositoryPrisma,
    },
  ],
})
export class IncidentsModule {}
