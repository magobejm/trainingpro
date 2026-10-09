import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ClientPhysicalTestAssignmentView,
  ClientPhysicalTestScheduleView,
  ClientPhysicalTestWithHistoryView,
  CoachPhysicalTestScheduleView,
  PhysicalTestCalendarRow,
  PhysicalTestResultView,
  PhysicalTestView,
  RecordPhysicalTestResultInput,
} from '../../domain/physical-test.entity';
import {
  decidePhysicalTestSchedule,
  PHYSICAL_TEST_DAY_DONE,
  PHYSICAL_TEST_DAY_PENDING,
  utcDateOnly,
} from '../../domain/schedule-physical-test';
import {
  mapAssignment,
  mapClientSchedule,
  mapCoachSchedule,
  mapPhysicalTest,
  mapResult,
  mapUnassignedSchedules,
} from './physical-test-row.mappers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

type ClientRow = {
  id: string;
  email: string;
};

const physicalTestSelect = {
  id: true,
  code: true,
  category: true,
  name: true,
  level: true,
  objective: true,
  whatToDo: true,
  whatToMeasure: true,
  options: true,
  normTables: true,
  sortOrder: true,
} satisfies Prisma.PhysicalTestSelect;

const resultSelect = {
  id: true,
  clientId: true,
  physicalTestId: true,
  inputsJson: true,
  rawScore: true,
  classification: true,
  classificationColor: true,
  measuredAt: true,
} satisfies Prisma.ClientPhysicalTestResultSelect;

const scheduleInclude = {
  physicalTest: { select: physicalTestSelect },
  result: { select: resultSelect },
} satisfies Prisma.ClientPhysicalTestScheduleInclude;

@Injectable()
export class PhysicalTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCatalog(): Promise<PhysicalTestView[]> {
    const rows = await this.prisma.physicalTest.findMany({
      select: physicalTestSelect,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map(mapPhysicalTest);
  }

  async listClientAssignments(clientId: string): Promise<ClientPhysicalTestAssignmentView[]> {
    const [rows, schedules] = await Promise.all([
      this.prisma.clientPhysicalTest.findMany({
        where: { clientId },
        include: {
          physicalTest: { select: physicalTestSelect },
          results: { select: resultSelect, orderBy: { measuredAt: 'desc' } },
        },
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.clientPhysicalTestSchedule.findMany({
        where: { archivedAt: null, clientId },
        select: {
          id: true,
          physicalTest: { select: physicalTestSelect },
          physicalTestId: true,
          resultId: true,
          scheduledDate: true,
        },
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);
    const assigned = new Set(rows.map((row) => row.physicalTestId));
    return [
      ...rows.map((row) => mapAssignment(row, schedules)),
      ...mapUnassignedSchedules(
        clientId,
        schedules.filter((schedule) => !assigned.has(schedule.physicalTestId)),
      ),
    ];
  }

  async listClientAssignmentsWithHistory(clientId: string): Promise<ClientPhysicalTestWithHistoryView[]> {
    return this.listClientAssignments(clientId);
  }

  async assignTest(
    clientId: string,
    physicalTestId: string,
    assignedBy?: string,
  ): Promise<ClientPhysicalTestAssignmentView> {
    await this.assertPhysicalTestExists(physicalTestId);
    const existing = await this.prisma.clientPhysicalTest.findUnique({
      where: { clientId_physicalTestId: { clientId, physicalTestId } },
      include: {
        physicalTest: { select: physicalTestSelect },
        results: { select: resultSelect, orderBy: { measuredAt: 'desc' }, take: 1 },
      },
    });
    if (existing) {
      throw new ConflictException('Physical test already assigned to client');
    }
    const created = await this.prisma.clientPhysicalTest.create({
      data: { clientId, physicalTestId, assignedBy: assignedBy ?? null },
      include: {
        physicalTest: { select: physicalTestSelect },
        results: { select: resultSelect, orderBy: { measuredAt: 'desc' }, take: 1 },
      },
    });
    return mapAssignment(created, []);
  }

  async unassignTest(clientId: string, physicalTestId: string): Promise<void> {
    const assignment = await this.prisma.clientPhysicalTest.findUnique({
      where: { clientId_physicalTestId: { clientId, physicalTestId } },
      select: { id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Physical test assignment not found');
    }
    await this.prisma.clientPhysicalTest.delete({ where: { id: assignment.id } });
  }

  async recordResult(input: RecordPhysicalTestResultInput): Promise<PhysicalTestResultView> {
    await this.assertPhysicalTestExists(input.physicalTestId);
    const created = await this.prisma.$transaction(async (tx) => {
      await this.ensureAssignment(tx, input.clientId, input.physicalTestId, input.recordedByMembershipId ?? null);
      const assignment = await tx.clientPhysicalTest.findUnique({
        where: {
          clientId_physicalTestId: { clientId: input.clientId, physicalTestId: input.physicalTestId },
        },
        select: { id: true },
      });
      if (!assignment) {
        throw new NotFoundException('Physical test is not assigned to this client');
      }
      return this.insertResult(tx, input, assignment.id);
    });
    return mapResult(created);
  }

  async listClientResults(clientId: string, physicalTestId?: string): Promise<PhysicalTestResultView[]> {
    const rows = await this.prisma.clientPhysicalTestResult.findMany({
      where: { clientId, ...(physicalTestId ? { physicalTestId } : {}) },
      select: resultSelect,
      orderBy: { measuredAt: 'desc' },
    });
    return rows.map(mapResult);
  }

  async resolveClientByEmail(email: string): Promise<ClientRow> {
    if (!email) {
      throw new ForbiddenException('Client email not found in auth context');
    }
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email },
      select: { id: true, email: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return client;
  }

  async resolveCoachMembership(context: AuthContext): Promise<CoachMembership> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true, organizationId: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }

  async assertCoachOwnsClient(context: AuthContext, clientId: string): Promise<CoachMembership> {
    const membership = await this.resolveCoachMembership(context);
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found for current coach');
    }
    return membership;
  }

  async readPhysicalTestById(physicalTestId: string): Promise<PhysicalTestView> {
    const row = await this.prisma.physicalTest.findUnique({
      where: { id: physicalTestId },
      select: physicalTestSelect,
    });
    if (!row) {
      throw new NotFoundException('Physical test not found');
    }
    return mapPhysicalTest(row);
  }

  async createSchedule(input: {
    clientId: string;
    createdByMembershipId: string;
    date: string;
    physicalTestId: string;
    replace: boolean;
  }): Promise<CoachPhysicalTestScheduleView> {
    await this.assertPhysicalTestExists(input.physicalTestId);
    const scheduledDate = utcDateOnly(input.date);
    try {
      return await this.prisma.$transaction((tx) => this.insertSchedule(tx, input, scheduledDate));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ code: PHYSICAL_TEST_DAY_PENDING });
      }
      throw error;
    }
  }

  async archiveSchedule(clientId: string, scheduleId: string): Promise<void> {
    const row = await this.prisma.clientPhysicalTestSchedule.findFirst({
      where: { archivedAt: null, clientId, id: scheduleId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Scheduled physical test not found');
    await this.prisma.clientPhysicalTestSchedule.update({
      where: { id: row.id },
      data: { archivedAt: new Date() },
    });
  }

  async listSchedulesForCoach(clientId: string): Promise<CoachPhysicalTestScheduleView[]> {
    const rows = await this.prisma.clientPhysicalTestSchedule.findMany({
      where: { archivedAt: null, clientId },
      include: scheduleInclude,
      orderBy: { scheduledDate: 'asc' },
    });
    return rows.map(mapCoachSchedule);
  }

  async listSchedulesForClient(clientId: string, dateFrom: Date, dateTo: Date): Promise<ClientPhysicalTestScheduleView[]> {
    const rows = await this.prisma.clientPhysicalTestSchedule.findMany({
      where: { archivedAt: null, clientId, scheduledDate: { gte: dateFrom, lte: dateTo } },
      include: scheduleInclude,
      orderBy: { scheduledDate: 'asc' },
    });
    return rows.map(mapClientSchedule);
  }

  async listScheduleCalendarRows(input: {
    clientId?: string;
    coachMembershipId?: string;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<PhysicalTestCalendarRow[]> {
    const rows = await this.prisma.clientPhysicalTestSchedule.findMany({
      where: {
        archivedAt: null,
        scheduledDate: { gte: input.dateFrom, lte: input.dateTo },
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.coachMembershipId ? { client: { archivedAt: null, coachMembershipId: input.coachMembershipId } } : {}),
      },
      select: {
        client: { select: { coachMembershipId: true, firstName: true, lastName: true } },
        clientId: true,
        createdAt: true,
        id: true,
        physicalTest: { select: { name: true } },
        resultId: true,
        scheduledDate: true,
        updatedAt: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });
    return rows.map((row) => ({
      clientId: row.clientId,
      clientName: `${row.client.firstName} ${row.client.lastName}`,
      coachMembershipId: row.client.coachMembershipId,
      createdAt: row.createdAt,
      done: row.resultId != null,
      id: row.id,
      scheduledDate: row.scheduledDate,
      testName: row.physicalTest.name,
      updatedAt: row.updatedAt,
    }));
  }

  private async insertResult(tx: Prisma.TransactionClient, input: RecordPhysicalTestResultInput, assignmentId: string) {
    if (input.scheduleId) {
      await this.lockOpenSchedule(tx, input.clientId, input.physicalTestId, input.scheduleId);
    }
    const created = await tx.clientPhysicalTestResult.create({
      data: {
        classification: input.evaluation.classification,
        classificationColor: input.evaluation.color,
        clientId: input.clientId,
        clientPhysicalTestId: assignmentId,
        inputsJson: input.inputs as unknown as Prisma.InputJsonValue,
        physicalTestId: input.physicalTestId,
        rawScore: input.evaluation.rawScore,
        recordedByMembershipId: input.recordedByMembershipId ?? null,
      },
      select: resultSelect,
    });
    if (input.scheduleId) {
      await tx.clientPhysicalTestSchedule.update({
        where: { id: input.scheduleId },
        data: { resultId: created.id },
      });
    }
    return created;
  }

  private async insertSchedule(
    tx: Prisma.TransactionClient,
    input: {
      clientId: string;
      createdByMembershipId: string;
      physicalTestId: string;
      replace: boolean;
    },
    scheduledDate: Date,
  ): Promise<CoachPhysicalTestScheduleView> {
    const existing = await tx.clientPhysicalTestSchedule.findFirst({
      where: { archivedAt: null, clientId: input.clientId, scheduledDate },
      include: { physicalTest: { select: { name: true } } },
    });
    const decision = decidePhysicalTestSchedule(existing ? { resultId: existing.resultId } : null, input.replace);
    if (decision.kind === 'reject') {
      throw new ConflictException({
        code: decision.code,
        scheduleId: existing?.id,
        testName: existing?.physicalTest.name,
      });
    }
    if (existing && decision.kind === 'replace') {
      await tx.clientPhysicalTestSchedule.update({
        where: { id: existing.id },
        data: { archivedAt: new Date() },
      });
    }
    await this.ensureAssignment(tx, input.clientId, input.physicalTestId, input.createdByMembershipId);
    const created = await tx.clientPhysicalTestSchedule.create({
      data: {
        clientId: input.clientId,
        createdByMembershipId: input.createdByMembershipId,
        physicalTestId: input.physicalTestId,
        scheduledDate,
      },
      include: scheduleInclude,
    });
    return mapCoachSchedule(created);
  }

  private async ensureAssignment(
    tx: Prisma.TransactionClient,
    clientId: string,
    physicalTestId: string,
    assignedBy: string | null,
  ) {
    const existing = await tx.clientPhysicalTest.findUnique({
      where: { clientId_physicalTestId: { clientId, physicalTestId } },
      select: { id: true },
    });
    if (existing) return;
    await tx.clientPhysicalTest.create({ data: { assignedBy, clientId, physicalTestId } });
  }

  private async lockOpenSchedule(
    tx: Prisma.TransactionClient,
    clientId: string,
    physicalTestId: string,
    scheduleId: string,
  ) {
    const schedule = await tx.clientPhysicalTestSchedule.findFirst({
      where: { archivedAt: null, clientId, id: scheduleId, physicalTestId },
      select: { id: true, resultId: true },
    });
    if (!schedule) throw new NotFoundException('Scheduled physical test not found');
    if (schedule.resultId) throw new ConflictException({ code: PHYSICAL_TEST_DAY_DONE });
  }

  private async assertPhysicalTestExists(physicalTestId: string) {
    const row = await this.prisma.physicalTest.findUnique({
      where: { id: physicalTestId },
      select: physicalTestSelect,
    });
    if (!row) {
      throw new NotFoundException('Physical test not found');
    }
    return mapPhysicalTest(row);
  }
}
