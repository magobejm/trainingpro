import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  OrgAdminRepositoryPort,
  OrganizationOccupancy,
} from '../../domain/org-admin.repository.port';

@Injectable()
export class OrgAdminRepositoryPrisma implements OrgAdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getOccupancyByAdmin(adminSupabaseUid: string): Promise<OrganizationOccupancy> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    return this.readOccupancy(organizationId);
  }

  async updateClientLimitByAdmin(
    adminSupabaseUid: string,
    clientLimit: number,
  ): Promise<OrganizationOccupancy> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    await this.prisma.organizationSubscription.upsert({
      where: { organizationId },
      create: { activeClientCount: 0, clientLimit, organizationId },
      update: { clientLimit },
    });
    return this.readOccupancy(organizationId);
  }

  private async resolveAdminOrganizationId(adminSupabaseUid: string): Promise<string> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.ADMIN,
        user: { supabaseUid: adminSupabaseUid },
      },
      select: { organizationId: true },
    });
    if (!membership) {
      throw new ForbiddenException('Admin membership not found');
    }
    return membership.organizationId;
  }

  private async readOccupancy(organizationId: string): Promise<OrganizationOccupancy> {
    const subscription = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      select: { activeClientCount: true, clientLimit: true },
    });
    if (!subscription) {
      return { activeClientCount: 0, clientLimit: 0, organizationId };
    }
    return { ...subscription, organizationId };
  }
}
