import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { TestInputs } from '../../domain/evaluate-test';
import type {
  ClientPhysicalTestAssignmentView,
  ClientPhysicalTestWithHistoryView,
  PhysicalTestResultView,
  PhysicalTestView,
  RecordPhysicalTestResultInput,
} from '../../domain/physical-test.entity';

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
    const rows = await this.prisma.clientPhysicalTest.findMany({
      where: { clientId },
      include: {
        physicalTest: { select: physicalTestSelect },
        results: { select: resultSelect, orderBy: { measuredAt: 'desc' }, take: 1 },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      clientId: row.clientId,
      physicalTestId: row.physicalTestId,
      assignedAt: row.assignedAt.toISOString(),
      physicalTest: mapPhysicalTest(row.physicalTest),
      latestResult: row.results[0] ? mapResult(row.results[0]) : null,
    }));
  }

  async listClientAssignmentsWithHistory(clientId: string): Promise<ClientPhysicalTestWithHistoryView[]> {
    const rows = await this.prisma.clientPhysicalTest.findMany({
      where: { clientId },
      include: {
        physicalTest: { select: physicalTestSelect },
        results: { select: resultSelect, orderBy: { measuredAt: 'desc' } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      clientId: row.clientId,
      physicalTestId: row.physicalTestId,
      assignedAt: row.assignedAt.toISOString(),
      physicalTest: mapPhysicalTest(row.physicalTest),
      latestResult: row.results[0] ? mapResult(row.results[0]) : null,
      results: row.results.map(mapResult),
    }));
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
    return {
      id: created.id,
      clientId: created.clientId,
      physicalTestId: created.physicalTestId,
      assignedAt: created.assignedAt.toISOString(),
      physicalTest: mapPhysicalTest(created.physicalTest),
      latestResult: null,
    };
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
    const assignment = await this.prisma.clientPhysicalTest.findUnique({
      where: {
        clientId_physicalTestId: {
          clientId: input.clientId,
          physicalTestId: input.physicalTestId,
        },
      },
      select: { id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Physical test is not assigned to this client');
    }
    const created = await this.prisma.clientPhysicalTestResult.create({
      data: {
        clientId: input.clientId,
        physicalTestId: input.physicalTestId,
        clientPhysicalTestId: assignment.id,
        inputsJson: input.inputs as unknown as Prisma.InputJsonValue,
        rawScore: input.evaluation.rawScore,
        classification: input.evaluation.classification,
        classificationColor: input.evaluation.color,
        recordedByMembershipId: input.recordedByMembershipId ?? null,
      },
      select: resultSelect,
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

function mapPhysicalTest(row: {
  id: string;
  code: string;
  category: string;
  name: string;
  level: string;
  objective: string;
  whatToDo: string;
  whatToMeasure: string;
  options: Prisma.JsonValue;
  normTables: Prisma.JsonValue;
  sortOrder: number;
}): PhysicalTestView {
  const options = row.options as { economic: string; pro: string } | null;
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    name: row.name,
    level: row.level,
    objective: row.objective,
    whatToDo: row.whatToDo,
    whatToMeasure: row.whatToMeasure,
    options,
    normTables: row.normTables,
    sortOrder: row.sortOrder,
  };
}

function mapResult(row: {
  id: string;
  clientId: string;
  physicalTestId: string;
  inputsJson: Prisma.JsonValue;
  rawScore: string;
  classification: string;
  classificationColor: string | null;
  measuredAt: Date;
}): PhysicalTestResultView {
  return {
    id: row.id,
    clientId: row.clientId,
    physicalTestId: row.physicalTestId,
    inputsJson: row.inputsJson as unknown as TestInputs,
    rawScore: row.rawScore,
    classification: row.classification,
    classificationColor: row.classificationColor,
    measuredAt: row.measuredAt.toISOString(),
  };
}
