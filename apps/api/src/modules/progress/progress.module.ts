import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetExerciseProgressUseCase } from './application/use-cases/get-exercise-progress.usecase';
import { GetMicrocycleProgressUseCase } from './application/use-cases/get-microcycle-progress.usecase';
import { GetProgressOverviewUseCase } from './application/use-cases/get-progress-overview.usecase';
import { GetRecentSessionsUseCase } from './application/use-cases/get-recent-sessions.usecase';
import { GetSessionProgressUseCase } from './application/use-cases/get-session-progress.usecase';
import { PROGRESS_REPOSITORY } from './domain/progress-repository.port';
import { ProgressRepositoryPrisma } from './infra/prisma/progress.repository.prisma';
import { ProgressController } from './presentation/controllers/progress.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProgressController],
  providers: [
    GetProgressOverviewUseCase,
    GetExerciseProgressUseCase,
    GetSessionProgressUseCase,
    GetMicrocycleProgressUseCase,
    GetRecentSessionsUseCase,
    ProgressRepositoryPrisma,
    {
      provide: PROGRESS_REPOSITORY,
      useExisting: ProgressRepositoryPrisma,
    },
  ],
})
export class ProgressModule {}
