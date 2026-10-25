import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ClientProductivityService } from '../../application/services/client-productivity.service';

const score = z.number().int().min(1).max(5);
const clientId = z.object({ clientId: z.string().uuid() });

class CheckinDto {
  static schema = z.object({
    date: z.string().date(),
    motivation: score,
    pain: score.nullable().optional(),
    recovery: score,
    sleep: score,
  });
  date!: string;
  motivation!: number;
  pain?: number | null;
  recovery!: number;
  sleep!: number;
}

class BulkDto {
  static schema = z.object({
    action: z.discriminatedUnion('action', [
      z.object({ action: z.literal('assignNutritionPlan'), planId: z.string().uuid() }),
      z.object({ action: z.literal('assignRoutine'), templateId: z.string().uuid() }),
      z.object({ action: z.literal('broadcastMessage'), message: z.string().trim().min(1).max(2000) }),
      z.object({
        action: z.literal('scheduleTest'),
        date: z.string().date(),
        physicalTestId: z.string().uuid(),
      }),
    ]),
    clientIds: z.array(z.string().uuid()).min(1).max(100),
  });
}

class MeasurementDto {
  static schema = z.object({
    bodyFatPct: z.number().min(0).max(80).nullable().optional(),
    fcMax: z.number().int().min(80).max(250).nullable().optional(),
    fcRest: z.number().int().min(30).max(160).nullable().optional(),
    heightCm: z.number().min(80).max(260).nullable().optional(),
    hipCm: z.number().min(40).max(220).nullable().optional(),
    measuredAt: z.string().datetime(),
    notes: z.string().max(500).nullable().optional(),
    skinfoldsJson: z.record(z.string(), z.number()).nullable().optional(),
    waistCm: z.number().min(40).max(220).nullable().optional(),
    weightKg: z.number().min(20).max(400).nullable().optional(),
  });
}

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientProductivityController {
  constructor(private readonly productivity: ClientProductivityService) {}

  @Post('me/checkins')
  @Roles('client')
  checkin(@Body() body: CheckinDto, @Req() request: HttpAuthRequest) {
    return this.productivity.saveCheckin(readAuthContext(request), body);
  }

  @Get('me/intake')
  @Roles('client')
  myIntake(@Req() request: HttpAuthRequest) {
    return this.productivity.readMyIntake(readAuthContext(request));
  }

  @Post('me/intake')
  @Roles('client')
  saveIntake(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    return this.productivity.saveIntake(readAuthContext(request), body, false);
  }

  @Post('me/intake/complete')
  @Roles('client')
  completeIntake(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    return this.productivity.saveIntake(readAuthContext(request), body, true);
  }

  @Post('bulk')
  @Roles('coach')
  bulk(@Body() body: BulkDto, @Req() request: HttpAuthRequest) {
    const parsed = BulkDto.schema.parse(body);
    return this.productivity.bulk(readAuthContext(request), parsed.clientIds, parsed.action);
  }

  @Get(':clientId/intake')
  @Roles('coach')
  clientIntake(@Param() params: { clientId: string }, @Req() request: HttpAuthRequest) {
    return this.productivity.readClientIntake(readAuthContext(request), clientId.parse(params).clientId);
  }

  @Post(':clientId/measurements')
  @Roles('coach')
  measurement(@Param() params: { clientId: string }, @Body() body: MeasurementDto, @Req() request: HttpAuthRequest) {
    const id = clientId.parse(params).clientId;
    return this.productivity.recordMeasurement(readAuthContext(request), id, MeasurementDto.schema.parse(body));
  }

  @Patch(':clientId/weekly-reports/:reportId/review')
  @Roles('coach')
  review(@Param() params: { clientId: string; reportId: string }, @Req() request: HttpAuthRequest) {
    return this.productivity.reviewReport(readAuthContext(request), params.clientId, params.reportId);
  }
}
