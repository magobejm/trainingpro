import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CoachesModule } from './modules/coaches/coaches.module';
import { FilesModule } from './modules/files/files.module';
import { HealthController } from './modules/health/presentation/health.controller';
import { LibraryModule } from './modules/library/library.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrgModule } from './modules/org/org.module';
import { PlansModule } from './modules/plans/plans.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { IncidentsModule } from './modules/incidents/incidents.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FilesModule,
    ChatModule,
    UsersModule,
    MaintenanceModule,
    NotificationsModule,
    OrgModule,
    CoachesModule,
    ClientsModule,
    LibraryModule,
    PlansModule,
    SessionsModule,
    ProgressModule,
    ReportsModule,
    IncidentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
