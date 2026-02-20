import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnsureCardioSessionUseCase } from './application/use-cases/ensure-cardio-session.usecase';
import { EnsureSessionUseCase } from './application/use-cases/ensure-session.usecase';
import { FinishCardioSessionUseCase } from './application/use-cases/finish-cardio-session.usecase';
import { FinishSessionUseCase } from './application/use-cases/finish-session.usecase';
import { GetCardioSessionUseCase } from './application/use-cases/get-cardio-session.usecase';
import { GetSessionUseCase } from './application/use-cases/get-session.usecase';
import { LogIntervalUseCase } from './application/use-cases/log-interval.usecase';
import { LogSetUseCase } from './application/use-cases/log-set.usecase';
import { StartCardioSessionUseCase } from './application/use-cases/start-cardio-session.usecase';
import { StartSessionUseCase } from './application/use-cases/start-session.usecase';
import { EditWindowPolicy } from './domain/policies/edit-window.policy';
import { SessionAccessPolicy } from './domain/policies/session-access.policy';
import { SESSIONS_REPOSITORY } from './domain/sessions-repository.port';
import { SessionsCardioRepositoryPrisma } from './infra/prisma/sessions-cardio.repository.prisma';
import { SessionsRepositoryPrisma } from './infra/prisma/sessions.repository.prisma';
import { SessionsCardioController } from './presentation/controllers/sessions-cardio.controller';
import { SessionsController } from './presentation/controllers/sessions.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [SessionsController, SessionsCardioController],
  providers: [
    EnsureCardioSessionUseCase,
    EnsureSessionUseCase,
    FinishCardioSessionUseCase,
    FinishSessionUseCase,
    GetCardioSessionUseCase,
    GetSessionUseCase,
    LogIntervalUseCase,
    LogSetUseCase,
    StartCardioSessionUseCase,
    StartSessionUseCase,
    EditWindowPolicy,
    SessionAccessPolicy,
    SessionsCardioRepositoryPrisma,
    SessionsRepositoryPrisma,
    {
      provide: SESSIONS_REPOSITORY,
      useExisting: SessionsRepositoryPrisma,
    },
  ],
})
export class SessionsModule {}
