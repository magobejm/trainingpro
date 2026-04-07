import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateCalendarEventUseCase } from '../../application/use-cases/create-calendar-event.usecase';
import { DeleteCalendarEventUseCase } from '../../application/use-cases/delete-calendar-event.usecase';
import { ListCalendarEventsUseCase } from '../../application/use-cases/list-calendar-events.usecase';
import { UpdateCalendarEventUseCase } from '../../application/use-cases/update-calendar-event.usecase';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { EventIdParamDto } from '../dto/event-id-param.dto';
import { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';

@Controller('calendar')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CalendarController {
  constructor(
    private readonly createCalendarEventUseCase: CreateCalendarEventUseCase,
    private readonly deleteCalendarEventUseCase: DeleteCalendarEventUseCase,
    private readonly listCalendarEventsUseCase: ListCalendarEventsUseCase,
    private readonly updateCalendarEventUseCase: UpdateCalendarEventUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateCalendarEventDto, @Req() request: HttpAuthRequest) {
    return this.createCalendarEventUseCase.execute(readAuthContext(request), body);
  }

  @Get()
  async list(@Query() query: ListCalendarEventsQueryDto, @Req() request: HttpAuthRequest) {
    const parsedQuery = {
      dateFrom: new Date(query.dateFrom),
      dateTo: new Date(query.dateTo),
      clientId: query.clientId,
    };
    return this.listCalendarEventsUseCase.execute(readAuthContext(request), parsedQuery);
  }

  @Patch(':eventId')
  async update(@Param() params: EventIdParamDto, @Body() body: UpdateCalendarEventDto, @Req() request: HttpAuthRequest) {
    return this.updateCalendarEventUseCase.execute(readAuthContext(request), params.eventId, body);
  }

  @Delete(':eventId')
  async delete(@Param() params: EventIdParamDto, @Req() request: HttpAuthRequest) {
    await this.deleteCalendarEventUseCase.execute(readAuthContext(request), params.eventId);
    return { success: true };
  }
}
