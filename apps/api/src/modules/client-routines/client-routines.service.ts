import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CLIENT_ROUTINE_VISIBLE_WEEKS,
  type CommandApplyRequest,
  type CommandApplyResponse,
  type RoutineEditorItemKind,
  type RoutineEditorItemMeta,
  type RoutineEditorResponse,
  type RoutineEditorSetPatch,
  type RoutineEditorWeek,
} from '@trainerpro/shared';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  activeClientRoutine,
  createClientRoutine,
  syncClientRoutineWeeks,
  todayKey,
} from '../plans/infra/prisma/client-routine.prisma';
import {
  addExercise,
  assertEditable,
  patchSet,
  removeExercise,
  replaceExercise,
  type NewExercise,
} from './client-routine-edit';
import { addBlock, type NewBlock } from './client-routine-blocks';
import {
  addItemSet,
  assertItem,
  assertSetOf,
  duplicateItem,
  moveItem,
  type ItemMove,
  patchItemSet,
  removeBlock,
  removeItemSet,
  swapItem,
  updateItemMeta,
} from './client-routine-items';
import { setDayWarmups, setExerciseGroup, type GroupMember } from './client-routine-groups';
import { applyProgression } from './client-routine-progression';
import {
  addWarmupItem,
  addWarmupSet,
  patchWarmupSet,
  removeWarmupItem,
  removeWarmupSet,
  swapWarmupItem,
  updateWarmupItemMeta,
} from './client-routine-warmups';
import { addClientDay, removeClientDay, renameClientDay } from './client-routine-days';
import { saveWeekNeats, type NeatInput } from './client-routine-neats';
import { buildWeek, weekWindow } from './client-routine-view';

@Injectable()
export class ClientRoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  private async coach(context: AuthContext, clientId: string) {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coaches can read client routines');
    const membership = await this.prisma.organizationMember.findFirst({
      select: { id: true },
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: context.subject } },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    const client = await this.prisma.client.findFirst({
      include: { activeRoutineAssignment: { select: { appliedAt: true } } },
      where: { archivedAt: null, coachMembershipId: membership.id, id: clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    return { client, membership };
  }

  /** Clients assigned before copies existed get theirs the first time the coach opens the routine. */
  private async ensureRoutine(context: AuthContext, clientId: string) {
    const { client } = await this.coach(context, clientId);
    let routine = await activeClientRoutine(this.prisma, clientId);
    if (!routine && client.trainingPlanId) {
      const startsOn = (client.activeRoutineAssignment?.appliedAt ?? new Date()).toISOString().slice(0, 10);
      await this.prisma.$transaction(
        (tx) => createClientRoutine(tx, clientId, client.trainingPlanId, context.subject, startsOn),
        { maxWait: 10_000, timeout: 30_000 },
      );
    }
    routine = await syncClientRoutineWeeks(this.prisma, clientId, context.subject);
    if (!routine) return null;
    return this.prisma.clientRoutine.findUniqueOrThrow({
      include: { baseTemplate: { select: { name: true } }, weeks: { orderBy: { weekIndex: 'asc' } } },
      where: { id: routine.id },
    });
  }

  async get(context: AuthContext, clientId: string): Promise<RoutineEditorResponse> {
    const routine = await this.ensureRoutine(context, clientId);
    if (!routine) return { olderWeeks: [], routine: null, weeks: [] };
    const today = todayKey();
    const split = Math.max(0, routine.weeks.length - CLIENT_ROUTINE_VISIBLE_WEEKS);
    const visible = await Promise.all(
      routine.weeks.slice(split).map((week) => buildWeek(this.prisma, routine, week, today)),
    );
    const older = routine.weeks.slice(0, split).map((week) => {
      const { from, to } = weekWindow(routine, week);
      return {
        endsOn: to,
        id: week.id,
        phase: to < today ? ('completed' as const) : ('future' as const),
        startsOn: from,
        weekIndex: week.weekIndex,
      };
    });
    return {
      olderWeeks: older.reverse(),
      routine: {
        cycleDays: routine.cycleDays,
        cycleStartsOn: routine.cycleStartsOn.toISOString().slice(0, 10),
        id: routine.id,
        name: routine.baseTemplate.name,
      },
      weeks: visible,
    };
  }

  async getWeek(context: AuthContext, clientId: string, weekId: string): Promise<RoutineEditorWeek> {
    const { routine, week } = await this.week(context, clientId, weekId);
    return buildWeek(this.prisma, routine, week, todayKey());
  }

  private async week(context: AuthContext, clientId: string, weekId: string) {
    const routine = await this.ensureRoutine(context, clientId);
    const week = routine?.weeks.find((item) => item.id === weekId);
    if (!routine || !week) throw new NotFoundException('Week not found');
    return { routine, week };
  }

  private async activeRoutine(context: AuthContext, clientId: string) {
    const routine = await this.ensureRoutine(context, clientId);
    if (!routine) throw new NotFoundException('The client has no routine');
    return routine;
  }

  async addDay(context: AuthContext, clientId: string, title: string) {
    const routine = await this.activeRoutine(context, clientId);
    await addClientDay(this.prisma, routine, todayKey(), title);
    return this.get(context, clientId);
  }

  async renameDay(context: AuthContext, clientId: string, dayId: string, title: string) {
    const routine = await this.activeRoutine(context, clientId);
    await renameClientDay(this.prisma, routine, todayKey(), dayId, title);
    return this.get(context, clientId);
  }

  async removeDay(context: AuthContext, clientId: string, dayId: string) {
    const routine = await this.activeRoutine(context, clientId);
    await removeClientDay(this.prisma, routine, todayKey(), dayId);
    return this.get(context, clientId);
  }

  async setNeats(context: AuthContext, clientId: string, weekId: string, neats: NeatInput[]) {
    const { routine, week } = await this.week(context, clientId, weekId);
    await saveWeekNeats(this.prisma, routine, week, todayKey(), neats);
    return this.getWeek(context, clientId, weekId);
  }

  async updateSet(context: AuthContext, clientId: string, weekId: string, setId: string, patch: RoutineEditorSetPatch) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const set = await this.prisma.planStrengthSet.findFirst({
      select: { exercise: { select: { dayId: true } } },
      where: { exercise: { day: { templateId: week.templateId } }, id: setId },
    });
    if (!set) throw new NotFoundException('Set not found in this week');
    await assertEditable(this.prisma, routine, week, set.exercise.dayId);
    await patchSet(this.prisma, setId, patch);
    return this.getWeek(context, clientId, weekId);
  }

  async addExercise(context: AuthContext, clientId: string, weekId: string, dayId: string, input: NewExercise) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const day = await assertEditable(this.prisma, routine, week, dayId);
    await addExercise(this.prisma, routine, week, day.dayIndex, input);
    return this.getWeek(context, clientId, weekId);
  }

  async replaceExercise(
    context: AuthContext,
    clientId: string,
    weekId: string,
    exerciseId: string,
    next: { displayName: string; exerciseLibraryId: string },
  ) {
    const { routine, week } = await this.week(context, clientId, weekId);
    await this.assertExercise(routine, week, exerciseId);
    await replaceExercise(this.prisma, routine, week, exerciseId, next);
    return this.getWeek(context, clientId, weekId);
  }

  async removeExercise(context: AuthContext, clientId: string, weekId: string, exerciseId: string) {
    const { routine, week } = await this.week(context, clientId, weekId);
    await this.assertExercise(routine, week, exerciseId);
    await removeExercise(this.prisma, routine, week, exerciseId);
    return this.getWeek(context, clientId, weekId);
  }

  async setGroup(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    input: { groupType: 'CIRCUIT' | 'SUPERSET' | null; items: GroupMember[] },
  ) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const day = await assertEditable(this.prisma, routine, week, dayId);
    await setExerciseGroup(this.prisma, routine, week, day.dayIndex, input);
    return this.getWeek(context, clientId, weekId);
  }

  async addBlock(context: AuthContext, clientId: string, weekId: string, dayId: string, input: NewBlock) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const day = await assertEditable(this.prisma, routine, week, dayId);
    await addBlock(this.prisma, routine, week, day.dayIndex, input);
    return this.getWeek(context, clientId, weekId);
  }

  async setWarmups(context: AuthContext, clientId: string, weekId: string, dayId: string, templateIds: string[]) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const day = await assertEditable(this.prisma, routine, week, dayId);
    const client = await this.prisma.client.findUniqueOrThrow({ select: { organizationId: true }, where: { id: clientId } });
    const visible = await this.prisma.warmupTemplate.count({
      where: {
        archivedAt: null,
        id: { in: templateIds },
        OR: [{ scope: 'GLOBAL' }, { organizationId: client.organizationId }, { ownerClientId: clientId }],
      },
    });
    if (visible !== new Set(templateIds).size) throw new NotFoundException('Warm-up not found');
    await setDayWarmups(this.prisma, routine, week, day.dayIndex, [...new Set(templateIds)]);
    return this.getWeek(context, clientId, weekId);
  }

  /** Runs one edit on an exercise of a day's warm-up, which first becomes the client's own copy. */
  async editWarmup(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    action: (scope: Parameters<typeof addWarmupItem>[0]) => Promise<void>,
  ) {
    const { routine, week } = await this.week(context, clientId, weekId);
    const day = await assertEditable(this.prisma, routine, week, dayId);
    await action({ day, routine, warmupId, week });
    return this.getWeek(context, clientId, weekId);
  }

  addWarmupItem(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    input: { displayName: string; kind: RoutineEditorItemKind; libraryId: string },
  ) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) => addWarmupItem(scope, this.prisma, input));
  }

  updateWarmupItem(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    itemId: string,
    meta: RoutineEditorItemMeta,
  ) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) =>
      updateWarmupItemMeta(scope, this.prisma, itemId, meta),
    );
  }

  replaceWarmupItem(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    itemId: string,
    next: { displayName: string; libraryId: string },
  ) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) =>
      swapWarmupItem(scope, this.prisma, itemId, next),
    );
  }

  removeWarmupItem(context: AuthContext, clientId: string, weekId: string, dayId: string, warmupId: string, itemId: string) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) =>
      removeWarmupItem(scope, this.prisma, itemId),
    );
  }

  addWarmupSet(context: AuthContext, clientId: string, weekId: string, dayId: string, warmupId: string, itemId: string) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) => addWarmupSet(scope, this.prisma, itemId));
  }

  removeWarmupSet(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    itemId: string,
    setId: string,
  ) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) =>
      removeWarmupSet(scope, this.prisma, itemId, setId),
    );
  }

  patchWarmupSet(
    context: AuthContext,
    clientId: string,
    weekId: string,
    dayId: string,
    warmupId: string,
    itemId: string,
    setId: string,
    patch: Record<string, unknown>,
  ) {
    return this.editWarmup(context, clientId, weekId, dayId, warmupId, (scope) =>
      patchWarmupSet(scope, this.prisma, itemId, setId, patch),
    );
  }

  /** Runs one edit on an exercise or block after checking its day is open, then returns the fresh week. */
  async editItem(
    context: AuthContext,
    clientId: string,
    weekId: string,
    kind: RoutineEditorItemKind,
    id: string,
    action: (routine: Parameters<typeof assertItem>[1], week: Parameters<typeof assertItem>[2]) => Promise<void>,
  ) {
    const { routine, week } = await this.week(context, clientId, weekId);
    await assertItem(this.prisma, routine, week, kind, id);
    await action(routine, week);
    return this.getWeek(context, clientId, weekId);
  }

  addSet(context: AuthContext, clientId: string, weekId: string, kind: RoutineEditorItemKind, id: string) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      addItemSet(this.prisma, routine, week, kind, id),
    );
  }

  removeSet(context: AuthContext, clientId: string, weekId: string, kind: RoutineEditorItemKind, id: string, setId: string) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      removeItemSet(this.prisma, routine, week, kind, id, setId),
    );
  }

  patchBlockSet(
    context: AuthContext,
    clientId: string,
    weekId: string,
    kind: RoutineEditorItemKind,
    id: string,
    setId: string,
    patch: Record<string, unknown>,
  ) {
    return this.editItem(context, clientId, weekId, kind, id, async () => {
      await assertSetOf(this.prisma, kind, id, setId);
      await patchItemSet(this.prisma, kind, setId, patch);
    });
  }

  updateMeta(
    context: AuthContext,
    clientId: string,
    weekId: string,
    kind: RoutineEditorItemKind,
    id: string,
    meta: RoutineEditorItemMeta,
  ) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      updateItemMeta(this.prisma, routine, week, kind, id, meta),
    );
  }

  replaceItem(
    context: AuthContext,
    clientId: string,
    weekId: string,
    kind: RoutineEditorItemKind,
    id: string,
    next: { displayName: string; libraryId: string },
  ) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      swapItem(this.prisma, routine, week, kind, id, next),
    );
  }

  duplicate(context: AuthContext, clientId: string, weekId: string, kind: RoutineEditorItemKind, id: string) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      duplicateItem(this.prisma, routine, week, kind, id),
    );
  }

  move(context: AuthContext, clientId: string, weekId: string, kind: RoutineEditorItemKind, id: string, target: ItemMove) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      moveItem(this.prisma, routine, week, kind, id, target),
    );
  }

  removeBlock(context: AuthContext, clientId: string, weekId: string, kind: RoutineEditorItemKind, id: string) {
    return this.editItem(context, clientId, weekId, kind, id, (routine, week) =>
      removeBlock(this.prisma, routine, week, kind, id),
    );
  }

  async applyProgression(context: AuthContext, clientId: string, input: CommandApplyRequest): Promise<CommandApplyResponse> {
    const routine = await this.ensureRoutine(context, clientId);
    if (!routine) throw new NotFoundException('The client has no routine');
    return applyProgression(this.prisma, routine, input);
  }

  private async assertExercise(
    routine: Parameters<typeof assertEditable>[1],
    week: Parameters<typeof assertEditable>[2],
    exerciseId: string,
  ) {
    const exercise = await this.prisma.planStrengthExercise.findFirst({
      select: { dayId: true },
      where: { archivedAt: null, day: { templateId: week.templateId }, id: exerciseId },
    });
    if (!exercise) throw new NotFoundException('Exercise not found in this week');
    await assertEditable(this.prisma, routine, week, exercise.dayId);
  }
}
