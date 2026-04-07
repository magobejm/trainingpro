import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateCalendarEventUseCase } from './application/use-cases/create-calendar-event.usecase';
import { DeleteCalendarEventUseCase } from './application/use-cases/delete-calendar-event.usecase';
import { ListCalendarEventsUseCase } from './application/use-cases/list-calendar-events.usecase';
import { UpdateCalendarEventUseCase } from './application/use-cases/update-calendar-event.usecase';
import { CALENDAR_REPOSITORY } from './domain/calendar.repository.port';
import { CalendarRepositoryPrisma } from './infra/prisma/calendar.repository.prisma';
import { CalendarController } from './presentation/controllers/calendar.controller';

@Module({
  imports: [AuthModule],
  controllers: [CalendarController],
  providers: [
    CreateCalendarEventUseCase,
    DeleteCalendarEventUseCase,
    ListCalendarEventsUseCase,
    UpdateCalendarEventUseCase,
    CalendarRepositoryPrisma,
    {
      provide: CALENDAR_REPOSITORY,
      useExisting: CalendarRepositoryPrisma,
    },
  ],
})
export class CalendarModule {}
