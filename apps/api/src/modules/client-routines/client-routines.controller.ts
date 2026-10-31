import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../auth/presentation/http-auth-request';
import { COMMAND_VARIABLES } from '@trainerpro/shared';
import { NEW_BLOCK_KINDS } from './client-routine-blocks';
import { ClientRoutinesService } from './client-routines.service';
import { CoachPresetsService } from './coach-presets.service';

function check<T extends ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }
  return parsed.data;
}

const uuid = z.string().uuid();
const optionalNumber = z.number().nullable().optional();
const setPatch = z
  .object({
    advancedTechnique: z.string().max(40).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    reps: z.number().int().min(0).max(1000).nullable().optional(),
    restSeconds: z.number().int().min(0).max(86_400).nullable().optional(),
    rir: z.number().int().min(0).max(20).nullable().optional(),
    rpe: z.number().min(0).max(10).nullable().optional(),
    weightKg: z.number().min(0).max(2000).nullable().optional(),
  })
  .strict();
const exerciseBody = z.object({
  displayName: z.string().trim().min(1).max(120),
  exerciseLibraryId: uuid,
  sets: z
    .array(
      z.object({
        reps: optionalNumber,
        restSeconds: optionalNumber,
        rir: optionalNumber,
        rpe: optionalNumber,
        weightKg: optionalNumber,
      }),
    )
    .max(30)
    .default([]),
});
const rule = z.object({
  mode: z.enum(['delta', 'percent', 'set']),
  value: z.number().min(-10_000).max(10_000),
  variable: z.enum(COMMAND_VARIABLES),
});
const progressionBody = z.object({
  cascade: z.boolean().default(false),
  dayIndexes: z.array(z.number().int().min(0).max(60)).max(60).default([]),
  rules: z.array(rule).min(1).max(6),
  weekIds: z.array(uuid).min(1).max(200),
});
const presetBody = rule;
const groupBody = z.object({
  exerciseIds: z.array(uuid).min(1).max(30),
  groupType: z.enum(['CIRCUIT', 'SUPERSET']).nullable(),
});
const warmupsBody = z.object({ warmupTemplateIds: z.array(uuid).max(10) });
const blockBody = z.object({
  displayName: z.string().trim().min(1).max(120),
  kind: z.enum(NEW_BLOCK_KINDS),
  libraryId: uuid,
});
const replaceBody = exerciseBody.pick({ displayName: true, exerciseLibraryId: true });

@Controller('clients/:clientId/routine')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class ClientRoutinesController {
  constructor(private readonly service: ClientRoutinesService) {}

  @Get()
  get(@Param('clientId') clientId: string, @Req() request: HttpAuthRequest) {
    return this.service.get(readAuthContext(request), check(uuid, clientId));
  }

  @Get('weeks/:weekId')
  week(@Param('clientId') clientId: string, @Param('weekId') weekId: string, @Req() request: HttpAuthRequest) {
    return this.service.getWeek(readAuthContext(request), check(uuid, clientId), check(uuid, weekId));
  }

  @Patch('weeks/:weekId/sets/:setId')
  updateSet(
    @Param() params: { clientId: string; setId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.updateSet(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.setId),
      check(setPatch, body),
    );
  }

  @Post('weeks/:weekId/days/:dayId/exercises')
  add(
    @Param() params: { clientId: string; dayId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.addExercise(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.dayId),
      check(exerciseBody, body),
    );
  }

  @Post('weeks/:weekId/days/:dayId/blocks')
  addBlock(
    @Param() params: { clientId: string; dayId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.addBlock(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.dayId),
      check(blockBody, body),
    );
  }

  @Put('weeks/:weekId/days/:dayId/groups')
  group(
    @Param() params: { clientId: string; dayId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.setGroup(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.dayId),
      check(groupBody, body),
    );
  }

  @Put('weeks/:weekId/days/:dayId/warmups')
  warmups(
    @Param() params: { clientId: string; dayId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.setWarmups(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.dayId),
      check(warmupsBody, body).warmupTemplateIds,
    );
  }

  @Patch('weeks/:weekId/exercises/:exerciseId')
  replace(
    @Param() params: { clientId: string; exerciseId: string; weekId: string },
    @Body() body: unknown,
    @Req() request: HttpAuthRequest,
  ) {
    return this.service.replaceExercise(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.exerciseId),
      check(replaceBody, body),
    );
  }

  @Delete('weeks/:weekId/exercises/:exerciseId')
  remove(@Param() params: { clientId: string; exerciseId: string; weekId: string }, @Req() request: HttpAuthRequest) {
    return this.service.removeExercise(
      readAuthContext(request),
      check(uuid, params.clientId),
      check(uuid, params.weekId),
      check(uuid, params.exerciseId),
    );
  }

  @Post('progression')
  progress(@Param('clientId') clientId: string, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    return this.service.applyProgression(readAuthContext(request), check(uuid, clientId), check(progressionBody, body));
  }
}

@Controller('coach/progression-presets')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CoachPresetsController {
  constructor(private readonly presets: CoachPresetsService) {}

  @Get()
  list(@Req() request: HttpAuthRequest) {
    return this.presets.list(readAuthContext(request));
  }

  @Post()
  add(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    return this.presets.add(readAuthContext(request), check(presetBody, body));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: HttpAuthRequest) {
    await this.presets.remove(readAuthContext(request), check(uuid, id));
    return { ok: true };
  }
}
