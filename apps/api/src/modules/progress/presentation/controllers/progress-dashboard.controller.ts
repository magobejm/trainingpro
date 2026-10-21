import { Controller, Get, Headers, Param, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ProgressDashboardService } from '../../application/progress-dashboard.service';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { readTimezoneOffset } from '../../../sessions/presentation/read-timezone-offset';

export const dailyExerciseSchema = z
  .object({
    clientId: postgresUuidString.optional(),
    exerciseId: postgresUuidString,
    exerciseType: z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']).default('strength'),
    from: z.string().date(),
    to: z.string().date(),
    assignmentId: postgresUuidString.optional(),
    cycles: z
      .string()
      .regex(/^\d+(,\d+)*$/)
      .transform((value) => [...new Set(value.split(',').map(Number))])
      .optional(),
  })
  .superRefine(spanWithin(PROGRESS_MAX_DAYS));
const clientSchema = z.object({ clientId: postgresUuidString.optional() });

@Controller('progress')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class ProgressDashboardController {
  constructor(private readonly dashboard: ProgressDashboardService) {}

  @Get('routines')
  catalog(@Query() query: Record<string, unknown>, @Req() request: HttpAuthRequest) {
    return this.dashboard.catalog(readAuthContext(request), clientSchema.parse(query).clientId);
  }

  @Get('routines/:assignmentId')
  routine(
    @Param('assignmentId') assignmentId: string,
    @Query() query: Record<string, unknown>,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') offset?: string,
  ) {
    return this.dashboard.routine(
      readAuthContext(request),
      postgresUuidString.parse(assignmentId),
      clientSchema.parse(query).clientId,
      readTimezoneOffset(offset),
    );
  }

  @Get('exercise/daily')
  daily(@Query() query: Record<string, unknown>, @Req() request: HttpAuthRequest) {
    return this.dashboard.daily(readAuthContext(request), dailyExerciseSchema.parse(query));
  }
}
