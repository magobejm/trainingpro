import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CoachAdminRepositoryPort,
  CoachAdminView,
  CreateCoachInput,
} from '../../domain/coach-admin.repository.port';

@Injectable()
export class CoachAdminRepositoryPrisma implements CoachAdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async activateCoach(
    adminSupabaseUid: string,
    coachMembershipId: string,
  ): Promise<CoachAdminView> {
    return this.updateCoachStatus(adminSupabaseUid, coachMembershipId, true);
  }

  async archiveCoach(adminSupabaseUid: string, coachMembershipId: string): Promise<CoachAdminView> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    const membership = await this.findCoachMembership(organizationId, coachMembershipId);
    return this.toCoachView(
      await this.prisma.organizationMember.update({
        where: { id: membership.id },
        data: { archivedAt: new Date(), isActive: false },
        include: { user: { select: { email: true } } },
      }),
    );
  }

  async createCoach(adminSupabaseUid: string, input: CreateCoachInput): Promise<CoachAdminView> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    const userId = await this.resolveCoachUserId(input);
    const membership = await this.prisma.organizationMember.upsert({
      where: { organizationId_userId_role: { organizationId, role: Role.COACH, userId } },
      create: { organizationId, role: Role.COACH, userId },
      update: { archivedAt: null, isActive: true },
      include: { user: { select: { email: true } } },
    });
    return this.toCoachView(membership);
  }

  async deactivateCoach(
    adminSupabaseUid: string,
    coachMembershipId: string,
  ): Promise<CoachAdminView> {
    return this.updateCoachStatus(adminSupabaseUid, coachMembershipId, false);
  }

  async listCoaches(adminSupabaseUid: string): Promise<CoachAdminView[]> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    const memberships = await this.prisma.organizationMember.findMany({
      where: { archivedAt: null, organizationId, role: Role.COACH },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map((membership) => this.toCoachView(membership));
  }

  private async updateCoachStatus(
    adminSupabaseUid: string,
    coachMembershipId: string,
    isActive: boolean,
  ): Promise<CoachAdminView> {
    const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
    const membership = await this.findCoachMembership(organizationId, coachMembershipId);
    return this.toCoachView(
      await this.prisma.organizationMember.update({
        where: { id: membership.id },
        data: { isActive },
        include: { user: { select: { email: true } } },
      }),
    );
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

  private async resolveCoachUserId(input: CreateCoachInput): Promise<string> {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { supabaseUid: input.supabaseUid }] },
      select: { id: true },
    });
    if (existingUser) {
      return existingUser.id;
    }
    const createdUser = await this.prisma.user.create({
      data: { email: input.email, supabaseUid: input.supabaseUid },
      select: { id: true },
    });
    return createdUser.id;
  }

  private async findCoachMembership(organizationId: string, coachMembershipId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, id: coachMembershipId, organizationId, role: Role.COACH },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found');
    }
    return membership;
  }

  private toCoachView(membership: {
    id: string;
    isActive: boolean;
    user: { email: string };
    userId: string;
  }): CoachAdminView {
    return {
      coachMembershipId: membership.id,
      email: membership.user.email,
      isActive: membership.isActive,
      userId: membership.userId,
    };
  }
}
