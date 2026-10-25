import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { estimateBilling, MIN_CLIENTS_FOR_COACH_METRICS, type PricingTier } from '@trainerpro/shared';
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
    const [active, tiers] = await Promise.all([
      this.prisma.client.count({ where: { archivedAt: null, organizationId } }),
      this.prisma.pricingTier.findMany({ orderBy: { fromClients: 'asc' }, where: { organizationId } }),
    ]);
    const today = new Date();
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    await this.prisma.billingSnapshot.upsert({
      create: { activeClientCount: active, day, organizationId },
      update: { activeClientCount: active },
      where: { organizationId_day: { day, organizationId } },
    });
    const mapped: PricingTier[] = tiers.map((tier) => ({
      fromClients: tier.fromClients,
      monthlyPrice: Number(tier.monthlyPrice),
      toClients: tier.toClients,
    }));
    return { activeClients: active, ...estimateBilling(active, mapped) };
  }

  async replaceTiers(adminUid: string, tiers: PricingTier[]) {
    const organizationId = await this.organizationId(adminUid);
    await this.prisma.$transaction([
      this.prisma.pricingTier.deleteMany({ where: { organizationId } }),
      this.prisma.pricingTier.createMany({
        data: tiers.map((tier, index) => ({ ...tier, organizationId, sortOrder: index })),
      }),
    ]);
    return this.billingEstimate(adminUid);
  }

  private async organizationId(adminUid: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.ADMIN, user: { supabaseUid: adminUid } },
    });
    if (!membership) throw new ForbiddenException('Admin membership not found');
    return membership.organizationId;
  }
}

function meanHours(rows: Array<{ createdAt: Date; reviewedAt: Date | null }>): number | null {
  const samples = rows.flatMap((row) =>
    row.reviewedAt ? [(row.reviewedAt.getTime() - row.createdAt.getTime()) / 3_600_000] : [],
  );
  if (samples.length === 0) return null;
  return Math.round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 10) / 10;
}
