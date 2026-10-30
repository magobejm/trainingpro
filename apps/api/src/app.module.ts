import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpErrorFilter } from './common/logging/http-error.filter';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { CoachHomeModule } from './modules/coach-home/coach-home.module';
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
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AiEvaluatorModule } from './modules/ai-evaluator/ai-evaluator.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CallsModule } from './modules/calls/calls.module';
import { NotesModule } from './modules/notes/notes.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { PhysicalTestsModule } from './modules/physical-tests/physical-tests.module';
import { ClientNotesModule } from './modules/client-notes/client-notes.module';
import { ClientRoutinesModule } from './modules/client-routines/client-routines.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FilesModule,
    ChatModule,
    CoachHomeModule,
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
    IntegrationsModule,
    IncidentsModule,
    AiEvaluatorModule,
    NotesModule,
    CalendarModule,
    CallsModule,
    NutritionModule,
    PhysicalTestsModule,
    ClientNotesModule,
    ClientRoutinesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
