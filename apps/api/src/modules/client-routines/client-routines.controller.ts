import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { postgresUuidString } from '../../common/zod/postgres-uuid.schema';
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
const groupItem = z.object({ id: uuid, kind: z.enum(['exercise', ...NEW_BLOCK_KINDS]) });
const groupBody = z.object({
  groupType: z.enum(['CIRCUIT', 'SUPERSET']).nullable(),
  items: z.array(groupItem).min(1).max(30),
});
const warmupsBody = z.object({ warmupTemplateIds: z.array(postgresUuidString).max(10) });
const blockBody = z.object({
  displayName: z.string().trim().min(1).max(120),
  kind: z.enum(NEW_BLOCK_KINDS),
  libraryId: uuid,
});
const replaceBody = exerciseBody.pick({ displayName: true, exerciseLibraryId: true });
const swapBody = z.object({ displayName: z.string().trim().min(1).max(120), libraryId: uuid });

const itemKind = z.enum(['exercise', ...NEW_BLOCK_KINDS]);
const blockSetPatch = z
  .object({
    advancedTechnique: z.string().max(40).nullable().optional(),
    distanceMeters: z.number().int().min(0).max(1_000_000).nullable().optional(),
    durationSeconds: z.number().int().min(0).max(86_400).nullable().optional(),
    fcMaxPct: z.number().int().min(0).max(100).nullable().optional(),
    fcMaxPctMax: z.number().int().min(0).max(100).nullable().optional(),
    fcReservePct: z.number().int().min(0).max(100).nullable().optional(),
    fcReservePctMax: z.number().int().min(0).max(100).nullable().optional(),
    heartRate: z.number().int().min(0).max(300).nullable().optional(),
    heartRateMax: z.number().int().min(0).max(300).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    reps: z.number().int().min(0).max(1000).nullable().optional(),
    restSeconds: z.number().int().min(0).max(86_400).nullable().optional(),
    rir: z.number().int().min(0).max(20).nullable().optional(),
    rom: z.string().max(30).nullable().optional(),
    rpe: z.number().min(0).max(10).nullable().optional(),
    weightKg: z.number().min(0).max(2000).nullable().optional(),
  })
  .strict();
const metaBody = z
  .object({
    durationMinutes: z.number().int().min(1).max(600).optional(),
    lockedFields: z.array(z.string().max(40)).max(20).optional(),
    notes: z.string().max(4000).nullable().optional(),
    repsRange: z
      .string()
      .trim()
      .max(20)
      .regex(/^\d+(\s*-\s*\d+)?$/)
      .nullable()
      .optional(),
  })
  .strict();
const moveBody = z.union([
  z.object({ direction: z.enum(['down', 'up']) }).strict(),
  z.object({ toIndex: z.number().int().min(0).max(200) }).strict(),
]);
type ItemParams = { clientId: string; itemId: string; kind: string; weekId: string };

function itemArgs(params: ItemParams, request: HttpAuthRequest) {
  return [
    readAuthContext(request),
    check(uuid, params.clientId),
    check(uuid, params.weekId),
    check(itemKind, params.kind),
    check(uuid, params.itemId),
  ] as const;
}

type WarmupParams = { clientId: string; dayId: string; itemId: string; setId: string; warmupId: string; weekId: string };
const warmupItemBody = z.object({
  displayName: z.string().trim().min(1).max(120),
  kind: itemKind,
  libraryId: uuid,
});
const warmupSetId = z.string().regex(/^[0-9a-f-]{36}:\d{1,3}$/i);

function warmupArgs(params: WarmupParams, request: HttpAuthRequest) {
  return [
    readAuthContext(request),
    check(uuid, params.clientId),
    check(uuid, params.weekId),
    check(uuid, params.dayId),
    check(uuid, params.warmupId),
  ] as const;
}

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

  @Post('weeks/:weekId/days/:dayId/warmups/:warmupId/items')
  addWarmupItem(@Param() params: WarmupParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.addWarmupItem(context, clientId, weekId, dayId, warmupId, check(warmupItemBody, body));
  }

  @Patch('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId')
  updateWarmupItem(@Param() params: WarmupParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.updateWarmupItem(
      context,
      clientId,
      weekId,
      dayId,
      warmupId,
      check(uuid, params.itemId),
      check(metaBody, body),
    );
  }

  @Delete('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId')
  removeWarmupItem(@Param() params: WarmupParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.removeWarmupItem(context, clientId, weekId, dayId, warmupId, check(uuid, params.itemId));
  }

  @Post('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId/replace')
  replaceWarmupItem(@Param() params: WarmupParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.replaceWarmupItem(
      context,
      clientId,
      weekId,
      dayId,
      warmupId,
      check(uuid, params.itemId),
      check(swapBody, body),
    );
  }

  @Post('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId/sets')
  addWarmupSet(@Param() params: WarmupParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.addWarmupSet(context, clientId, weekId, dayId, warmupId, check(uuid, params.itemId));
  }

  @Patch('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId/sets/:setId')
  patchWarmupSet(@Param() params: WarmupParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.patchWarmupSet(
      context,
      clientId,
      weekId,
      dayId,
      warmupId,
      check(uuid, params.itemId),
      check(warmupSetId, params.setId),
      check(blockSetPatch, body),
    );
  }

  @Delete('weeks/:weekId/days/:dayId/warmups/:warmupId/items/:itemId/sets/:setId')
  removeWarmupSet(@Param() params: WarmupParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, dayId, warmupId] = warmupArgs(params, request);
    return this.service.removeWarmupSet(
      context,
      clientId,
      weekId,
      dayId,
      warmupId,
      check(uuid, params.itemId),
      check(warmupSetId, params.setId),
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

  @Post('weeks/:weekId/items/:kind/:itemId/sets')
  addSet(@Param() params: ItemParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.addSet(context, clientId, weekId, kind, id);
  }

  @Delete('weeks/:weekId/items/:kind/:itemId/sets/:setId')
  removeSet(@Param() params: ItemParams & { setId: string }, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.removeSet(context, clientId, weekId, kind, id, check(uuid, params.setId));
  }

  @Patch('weeks/:weekId/items/:kind/:itemId/sets/:setId')
  patchItemSet(@Param() params: ItemParams & { setId: string }, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.patchBlockSet(
      context,
      clientId,
      weekId,
      kind,
      id,
      check(uuid, params.setId),
      check(blockSetPatch, body),
    );
  }

  @Patch('weeks/:weekId/items/:kind/:itemId')
  meta(@Param() params: ItemParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.updateMeta(context, clientId, weekId, kind, id, check(metaBody, body));
  }

  @Post('weeks/:weekId/items/:kind/:itemId/replace')
  replaceItem(@Param() params: ItemParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.replaceItem(context, clientId, weekId, kind, id, check(swapBody, body));
  }

  @Post('weeks/:weekId/items/:kind/:itemId/duplicate')
  duplicate(@Param() params: ItemParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.duplicate(context, clientId, weekId, kind, id);
  }

  @Post('weeks/:weekId/items/:kind/:itemId/move')
  move(@Param() params: ItemParams, @Body() body: unknown, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.move(context, clientId, weekId, kind, id, check(moveBody, body));
  }

  @Delete('weeks/:weekId/items/:kind/:itemId')
  removeItem(@Param() params: ItemParams, @Req() request: HttpAuthRequest) {
    const [context, clientId, weekId, kind, id] = itemArgs(params, request);
    return this.service.removeBlock(context, clientId, weekId, kind, id);
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
