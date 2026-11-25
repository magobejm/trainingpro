import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { estimateBilling, MIN_CLIENTS_FOR_COACH_METRICS } from '@trainerpro/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class OrgMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async coachMetrics(adminUid: string) {
    const organizationId = await this.organizationId(adminUid);
    const coaches = await this.prisma.organizationMember.findMany({
      select: { id: true, user: { select: { email: true } } },
      where: { archivedAt: null, isActive: true, organizationId, role: Role.COACH },
    });
    const rows = [];
    for (const coach of coaches) {
      const [active, archived, reports, incidents] = await Promise.all([
        this.prisma.client.count({ where: { archivedAt: null, coachMembershipId: coach.id } }),
        this.prisma.client.count({ where: { archivedAt: { not: null }, coachMembershipId: coach.id } }),
        this.prisma.weeklyReport.aggregate({ _avg: { adherencePercent: true }, where: { coachMembershipId: coach.id } }),
        this.prisma.incident.findMany({
          select: { createdAt: true, reviewedAt: true },
          where: { coachMembershipId: coach.id, reviewedAt: { not: null } },
        }),
      ]);
      const hidden = active + archived < MIN_CLIENTS_FOR_COACH_METRICS;
      const responseHours = meanHours(incidents);
      rows.push({
        activeClients: hidden ? null : active,
        adherencePercent: hidden ? null : reports._avg.adherencePercent,
        archivedClients: hidden ? null : archived,
        coachEmail: coach.user.email,
        incidentResponseHours: hidden ? null : responseHours,
      });
    }
    return { coaches: rows };
  }

  async billingEstimate(adminUid: string) {
    const organizationId = await this.organizationId(adminUid);
    const day = utcDay(new Date());
    const [active, subscription] = await Promise.all([
      this.recordOrganization(organizationId, day),
      this.prisma.organizationSubscription.findUnique({ where: { organizationId } }),
    ]);
    const peak = await this.monthPeak(organizationId, day);
    const clientLimit = subscription?.clientLimit ?? 0;
    return {
      activeClients: active,
      billableMonthly: estimateBilling(peak).monthly,
      clientLimit,
      estimatedMonthly: estimateBilling(clientLimit).monthly,
      peakActiveClients: peak,
    };
  }

  async recordDailySnapshots(now = new Date()): Promise<{ recorded: number }> {
    const day = utcDay(now);
    const [organizations, counts] = await Promise.all([
      this.prisma.organization.findMany({ select: { id: true } }),
      this.prisma.client.groupBy({
        by: ['organizationId'],
        where: { archivedAt: null },
        _count: { _all: true },
      }),
    ]);
    const activeByOrg = new Map(counts.map((row) => [row.organizationId, row._count._all]));
    for (const organization of organizations) {
      await this.writeSnapshot(organization.id, day, activeByOrg.get(organization.id) ?? 0);
    }
    return { recorded: organizations.length };
  }

  private async recordOrganization(organizationId: string, day: Date): Promise<number> {
    const active = await this.prisma.client.count({ where: { archivedAt: null, organizationId } });
    await this.writeSnapshot(organizationId, day, active);
    return active;
  }

  private async writeSnapshot(organizationId: string, day: Date, active: number): Promise<void> {
    await this.prisma.billingSnapshot.upsert({
      create: { activeClientCount: active, day, organizationId },
      update: { activeClientCount: active },
      where: { organizationId_day: { day, organizationId } },
    });
  }

  private async monthPeak(organizationId: string, day: Date): Promise<number> {
    const month = utcMonthRange(day);
    const peak = await this.prisma.billingSnapshot.aggregate({
      _max: { activeClientCount: true },
      where: { day: { gte: month.start, lt: month.end }, organizationId },
    });
    return peak._max.activeClientCount ?? 0;
  }

  private async organizationId(adminUid: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.ADMIN, user: { supabaseUid: adminUid } },
    });
    if (!membership) throw new ForbiddenException('Admin membership not found');
    return membership.organizationId;
  }
}

function utcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function utcMonthRange(day: Date): { end: Date; start: Date } {
  return {
    end: new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 1)),
    start: new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1)),
  };
}

function meanHours(rows: Array<{ createdAt: Date; reviewedAt: Date | null }>): number | null {
  const samples = rows.flatMap((row) =>
    row.reviewedAt ? [(row.reviewedAt.getTime() - row.createdAt.getTime()) / 3_600_000] : [],
  );
  if (samples.length === 0) return null;
  return Math.round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 10) / 10;
}
