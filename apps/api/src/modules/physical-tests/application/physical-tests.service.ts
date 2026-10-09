import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { evaluateTest, type TestInputs } from '../domain/evaluate-test';
import type {
  ClientPhysicalTestAssignmentView,
  ClientPhysicalTestScheduleView,
  ClientPhysicalTestWithHistoryView,
  CoachPhysicalTestScheduleView,
  PhysicalTestResultView,
  PhysicalTestView,
} from '../domain/physical-test.entity';
import { PhysicalTestsRepository } from '../infra/prisma/physical-tests.repository';

@Injectable()
export class PhysicalTestsService {
  constructor(private readonly repository: PhysicalTestsRepository) {}

  async listCatalog(): Promise<PhysicalTestView[]> {
    return this.repository.listCatalog();
  }

  async listClientAssignmentsForCoach(context: AuthContext, clientId: string): Promise<ClientPhysicalTestAssignmentView[]> {
    await this.repository.assertCoachOwnsClient(context, clientId);
    return this.repository.listClientAssignments(clientId);
  }

  async assignTestForCoach(
    context: AuthContext,
    clientId: string,
    physicalTestId: string,
  ): Promise<ClientPhysicalTestAssignmentView> {
    const membership = await this.repository.assertCoachOwnsClient(context, clientId);
    return this.repository.assignTest(clientId, physicalTestId, membership.id);
  }

  async unassignTestForCoach(context: AuthContext, clientId: string, physicalTestId: string): Promise<void> {
    await this.repository.assertCoachOwnsClient(context, clientId);
    await this.repository.unassignTest(clientId, physicalTestId);
  }

  async recordResultForCoach(
    context: AuthContext,
    clientId: string,
    physicalTestId: string,
    body: TestInputs & { scheduleId?: string },
  ): Promise<PhysicalTestResultView> {
    const inputs = coachInputs(body);
    const membership = await this.repository.assertCoachOwnsClient(context, clientId);
    const physicalTest = await this.repository.readPhysicalTestById(physicalTestId);
    const evaluation = evaluateTest(physicalTest.code, inputs);
    return this.repository.recordResult({
      clientId,
      evaluation,
      inputs,
      physicalTestId,
      recordedByMembershipId: membership.id,
    });
  }

  async listAssignedTestsForClient(context: AuthContext): Promise<ClientPhysicalTestWithHistoryView[]> {
    const client = await this.repository.resolveClientByEmail(context.email ?? '');
    return this.repository.listClientAssignmentsWithHistory(client.id);
  }

  async recordResultForClient(
    context: AuthContext,
    physicalTestId: string,
    body: TestInputs & { scheduleId?: string },
  ): Promise<PhysicalTestResultView> {
    const { scheduleId, ...inputs } = body;
    const client = await this.repository.resolveClientByEmail(context.email ?? '');
    const physicalTest = await this.repository.readPhysicalTestById(physicalTestId);
    const evaluation = evaluateTest(physicalTest.code, inputs);
    return this.repository.recordResult({
      clientId: client.id,
      evaluation,
      inputs,
      physicalTestId,
      scheduleId,
    });
  }

  async scheduleTestForCoach(
    context: AuthContext,
    clientId: string,
    input: { date: string; physicalTestId: string; replace?: boolean },
  ): Promise<CoachPhysicalTestScheduleView> {
    const membership = await this.repository.assertCoachOwnsClient(context, clientId);
    return this.repository.createSchedule({
      clientId,
      createdByMembershipId: membership.id,
      date: input.date,
      physicalTestId: input.physicalTestId,
      replace: input.replace ?? false,
    });
  }

  async listSchedulesForCoach(context: AuthContext, clientId: string): Promise<CoachPhysicalTestScheduleView[]> {
    await this.repository.assertCoachOwnsClient(context, clientId);
    return this.repository.listSchedulesForCoach(clientId);
  }

  async archiveScheduleForCoach(context: AuthContext, clientId: string, scheduleId: string): Promise<void> {
    await this.repository.assertCoachOwnsClient(context, clientId);
    await this.repository.archiveSchedule(clientId, scheduleId);
  }

  async listSchedulesForClient(
    context: AuthContext,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ClientPhysicalTestScheduleView[]> {
    const client = await this.repository.resolveClientByEmail(context.email ?? '');
    return this.repository.listSchedulesForClient(client.id, dateFrom, dateTo);
  }
}

function coachInputs(body: TestInputs & { scheduleId?: string }): TestInputs {
  return {
    age: body.age,
    distance: body.distance,
    eyesClosed: body.eyesClosed,
    gender: body.gender,
    hr: body.hr,
    level: body.level,
    palier: body.palier,
    reps: body.reps,
    timeMin: body.timeMin,
    timeSec: body.timeSec,
    weight: body.weight,
    workload: body.workload,
  };
}
