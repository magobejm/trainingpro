import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CLIENT_ROUTINE_VISIBLE_WEEKS,
  type CommandApplyRequest,
  type CommandApplyResponse,
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
import { applyProgression } from './client-routine-progression';
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
