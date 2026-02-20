import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetProgressOverviewUseCase } from './application/use-cases/get-progress-overview.usecase';
import { PROGRESS_REPOSITORY } from './domain/progress-repository.port';
import { ProgressRepositoryPrisma } from './infra/prisma/progress.repository.prisma';
import { ProgressController } from './presentation/controllers/progress.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProgressController],
  providers: [
    GetProgressOverviewUseCase,
    ProgressRepositoryPrisma,
    {
      provide: PROGRESS_REPOSITORY,
      useExisting: ProgressRepositoryPrisma,
    },
  ],
})
export class ProgressModule {}
