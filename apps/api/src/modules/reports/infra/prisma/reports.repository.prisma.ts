import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SessionStatus } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ReportsRepositoryPort } from '../../domain/reports.repository.port';
import { WeeklyReportPolicy } from '../../domain/policies/weekly-report.policy';
import type { UpsertWeeklyReportInput } from '../../domain/weekly-report.input';
import type { WeeklyReportView } from '../../domain/weekly-report.entity';
import { mapWeeklyReport } from './weekly-report-prisma.mappers';

@Injectable()
export class ReportsRepositoryPrisma implements ReportsRepositoryPort {
  constructor(
    private readonly policy: WeeklyReportPolicy,
    private readonly prisma: PrismaService,
  ) {}

  async getWeeklyReportByDate(
    context: AuthContext,
    reportDate: Date,
  ): Promise<null | WeeklyReportView> {
    const client = await this.readClientForContext(context);
    const weekStartDate = this.policy.resolveWeekStart(reportDate);
    const row = await this.prisma.weeklyReport.findFirst({
      where: { clientId: client.id, weekStartDate },
    });
    return row ? mapWeeklyReport(row) : null;
  }

  async upsertWeeklyReport(
    context: AuthContext,
    input: UpsertWeeklyReportInput,
  ): Promise<WeeklyReportView> {
    const client = await this.readClientForContext(context);
    if (input.sourceSessionId) {
      await this.assertSourceSession(client.id, input.reportDate, input.sourceSessionId);
    }
    const weekStartDate = this.policy.resolveWeekStart(input.reportDate);
    const row = await this.prisma.weeklyReport.upsert({
      where: { clientId_weekStartDate: { clientId: client.id, weekStartDate } },
      create: this.buildCreateData(context, input, client, weekStartDate),
      update: this.buildUpdateData(context, input),
    });
    return mapWeeklyReport(row);
  }

  private async assertSourceSession(
    clientId: string,
    reportDate: Date,
    sourceSessionId: string,
  ): Promise<void> {
    const session = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, clientId, id: sourceSessionId, status: SessionStatus.COMPLETED },
      select: { sessionDate: true },
    });
    if (!session) {
      throw new NotFoundException('Completed source session not found for client');
    }
    this.policy.ensureSessionDateMatchesReportDate(reportDate, session.sessionDate);
  }

  private buildCreateData(
    context: AuthContext,
    input: UpsertWeeklyReportInput,
    client: { coachMembershipId: string; id: string; organizationId: string },
    weekStartDate: Date,
  ) {
    return {
      ...buildCreateAuditFields(context),
      adherencePercent: input.adherencePercent ?? null,
      coachMembershipId: client.coachMembershipId,
      clientId: client.id,
      energy: input.energy ?? null,
      mood: input.mood ?? null,
      notes: input.notes ?? null,
      organizationId: client.organizationId,
      reportDate: input.reportDate,
      sleepHours: toDecimal(input.sleepHours),
      sourceSessionId: input.sourceSessionId ?? null,
      weekStartDate,
    };
  }

  private buildUpdateData(context: AuthContext, input: UpsertWeeklyReportInput) {
    return {
      ...buildUpdateAuditFields(context),
      adherencePercent: input.adherencePercent ?? null,
      energy: input.energy ?? null,
      mood: input.mood ?? null,
      notes: input.notes ?? null,
      reportDate: input.reportDate,
      sleepHours: toDecimal(input.sleepHours),
      sourceSessionId: input.sourceSessionId ?? null,
    };
  }

  private async readClientForContext(context: AuthContext) {
    if (context.activeRole !== 'client') {
      throw new ForbiddenException('Only client can manage weekly reports');
    }
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: context.email ?? '' },
      select: { coachMembershipId: true, id: true, organizationId: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    await this.assertCoachMembership(client.coachMembershipId);
    return client;
  }

  private async assertCoachMembership(coachMembershipId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, id: coachMembershipId, isActive: true, role: Role.COACH },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found');
    }
  }
}

function toDecimal(value: null | number | undefined): null | Prisma.Decimal {
  if (value === undefined || value === null) {
    return null;
  }
  return new Prisma.Decimal(value);
}
