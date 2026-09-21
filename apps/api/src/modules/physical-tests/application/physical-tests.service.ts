import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { evaluateTest, type TestInputs } from '../domain/evaluate-test';
import type {
  ClientPhysicalTestAssignmentView,
  ClientPhysicalTestWithHistoryView,
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
    inputs: TestInputs,
  ): Promise<PhysicalTestResultView> {
    const membership = await this.repository.assertCoachOwnsClient(context, clientId);
    const physicalTest = await this.repository.readPhysicalTestById(physicalTestId);
    const evaluation = evaluateTest(physicalTest.code, inputs);
    return this.repository.recordResult({
      clientId,
      physicalTestId,
      inputs,
      evaluation,
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
    inputs: TestInputs,
  ): Promise<PhysicalTestResultView> {
    const client = await this.repository.resolveClientByEmail(context.email ?? '');
    const physicalTest = await this.repository.readPhysicalTestById(physicalTestId);
    const evaluation = evaluateTest(physicalTest.code, inputs);
    return this.repository.recordResult({
      clientId: client.id,
      physicalTestId,
      inputs,
      evaluation,
    });
  }
}
