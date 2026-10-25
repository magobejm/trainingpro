import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../auth/presentation/http-auth-request';
import { CLOUD_PROVIDERS } from './integration-providers';
import { IntegrationsService } from './integrations.service';

const providerSchema = z.enum(CLOUD_PROVIDERS);
const dailySchema = z.object({
  days: z
    .array(
      z.object({
        activeKcal: z.number().int().nullable().optional(),
        bodyBattery: z.number().int().nullable().optional(),
        date: z.string().date(),
        hrvMs: z.number().int().nullable().optional(),
        restingHr: z.number().int().nullable().optional(),
        sleepMinutes: z.number().int().nullable().optional(),
        sleepScore: z.number().int().nullable().optional(),
        steps: z.number().int().nullable().optional(),
        weightKg: z.number().nullable().optional(),
      }),
    )
    .max(31),
  source: z.enum(['HEALTH_CONNECT', 'HEALTHKIT']),
});
const activitySchema = z.object({
  activities: z
    .array(
      z.object({
        avgHr: z.number().int().nullable().optional(),
        calories: z.number().int().nullable().optional(),
        distanceM: z.number().int().nullable().optional(),
        durationS: z.number().int().nonnegative(),
        externalId: z.string().min(1).max(160),
        maxHr: z.number().int().nullable().optional(),
        sportType: z.string().min(1).max(40),
        startAt: z.string().datetime(),
      }),
    )
    .max(50),
  source: z.enum(['HEALTH_CONNECT', 'HEALTHKIT']),
});
const watchSchema = z.object({
  blocks: z
    .array(
      z.object({
        displayName: z.string().min(1).max(80),
        fcMaxPct: z.number().nullable().optional(),
        fcReservePct: z.number().nullable().optional(),
        heartRate: z.number().int().nullable().optional(),
        restSeconds: z.number().int().nonnegative(),
        roundsPlanned: z.number().int().positive(),
        workSeconds: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(20),
  name: z.string().min(1).max(80),
  routineKey: z.string().min(1).max(120),
});

@Controller('clients/me')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientIntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('integrations')
  connections(@Req() request: HttpAuthRequest) {
    return this.integrations.myConnections(readAuthContext(request));
  }

  @Post('integrations/:provider/authorize')
  authorize(@Param('provider') provider: string, @Req() request: HttpAuthRequest) {
    return this.integrations.authorize(readAuthContext(request), providerSchema.parse(provider));
  }

  @Delete('integrations/:provider')
  disconnect(@Param('provider') provider: string, @Req() request: HttpAuthRequest) {
    return this.integrations.disconnect(readAuthContext(request), providerSchema.parse(provider));
  }

  @Post('integrations/strava/auto-export')
  autoExport(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = z.object({ autoExport: z.boolean() }).parse(body);
    return this.integrations.setAutoExport(readAuthContext(request), parsed.autoExport);
  }

  @Post('health/daily')
  daily(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = dailySchema.parse(body);
    return this.integrations.saveDaily(readAuthContext(request), parsed.source, parsed.days);
  }

  @Post('health/activities')
  activities(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = activitySchema.parse(body);
    return this.integrations.saveActivities(readAuthContext(request), parsed.source, parsed.activities);
  }

  @Get('health/checkin-hint')
  hint(@Req() request: HttpAuthRequest) {
    return this.integrations.checkinHint(readAuthContext(request));
  }
}

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CoachIntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get(':clientId/wearables')
  wearables(@Param('clientId') clientId: string, @Req() request: HttpAuthRequest) {
    return this.integrations.coachView(readAuthContext(request), z.string().uuid().parse(clientId));
  }

  @Post(':clientId/garmin/workouts')
  watch(@Param('clientId') clientId: string, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = watchSchema.parse(body);
    return this.integrations.sendToWatch(readAuthContext(request), z.string().uuid().parse(clientId), parsed);
  }
}

@Controller('integrations')
export class PublicIntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ) {
    const result = await this.integrations.callback(providerSchema.parse(provider), code ?? '', state ?? '');
    response.redirect(result.url);
  }

  @Post('webhooks/:provider')
  webhook(@Param('provider') provider: string, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = z.object({ payload: z.unknown(), type: z.string().min(1).max(80) }).parse(body);
    const secret = request.header('x-cron-secret');
    const cloud = providerSchema.parse(provider);
    return this.integrations.enqueueWebhook(cloud, parsed.type, parsed.payload, secret);
  }
}
