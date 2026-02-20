import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActivateCoachUseCase } from './application/activate-coach.usecase';
import { ArchiveCoachUseCase } from './application/archive-coach.usecase';
import { CreateCoachUseCase } from './application/create-coach.usecase';
import { DeactivateCoachUseCase } from './application/deactivate-coach.usecase';
import { ListCoachesUseCase } from './application/list-coaches.usecase';
import { COACH_ADMIN_REPOSITORY } from './domain/coach-admin.repository.port';
import { CoachAdminRepositoryPrisma } from './infra/prisma/coach-admin.repository.prisma';
import { CoachesAdminController } from './presentation/controllers/coaches-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [CoachesAdminController],
  providers: [
    ActivateCoachUseCase,
    ArchiveCoachUseCase,
    CreateCoachUseCase,
    DeactivateCoachUseCase,
    ListCoachesUseCase,
    CoachAdminRepositoryPrisma,
    {
      provide: COACH_ADMIN_REPOSITORY,
      useExisting: CoachAdminRepositoryPrisma,
    },
  ],
})
export class CoachesModule {}
