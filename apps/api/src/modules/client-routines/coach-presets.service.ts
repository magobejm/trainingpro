import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { CoachPresetItem, CommandMode, CommandVariable } from '@trainerpro/shared';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Custom progression values ("+ Añadir"), kept per coach so they show up in every client. */
@Injectable()
export class CoachPresetsService {
  constructor(private readonly prisma: PrismaService) {}

  private async membershipId(context: AuthContext): Promise<string> {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coaches have progression presets');
    const membership = await this.prisma.organizationMember.findFirst({
      select: { id: true },
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: context.subject } },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return membership.id;
  }

  async list(context: AuthContext): Promise<CoachPresetItem[]> {
    const rows = await this.prisma.coachPreset.findMany({
      orderBy: [{ variable: 'asc' }, { value: 'asc' }],
      where: { coachMembershipId: await this.membershipId(context) },
    });
    return rows.map((row) => this.item(row));
  }

  async add(
    context: AuthContext,
    input: { mode: CommandMode; value: number; variable: CommandVariable },
  ): Promise<CoachPresetItem> {
    const coachMembershipId = await this.membershipId(context);
    const key = { coachMembershipId, mode: input.mode, value: input.value, variable: input.variable };
    const row = await this.prisma.coachPreset.upsert({
      create: key,
      update: {},
      where: { coachMembershipId_variable_mode_value: key },
    });
    return this.item(row);
  }

  async remove(context: AuthContext, id: string): Promise<void> {
    const result = await this.prisma.coachPreset.deleteMany({
      where: { coachMembershipId: await this.membershipId(context), id },
    });
    if (result.count === 0) throw new NotFoundException('Preset not found');
  }

  private item(row: { id: string; mode: string; value: number; variable: string }): CoachPresetItem {
    return {
      id: row.id,
      mode: row.mode as CommandMode,
      value: row.value,
      variable: row.variable as CommandVariable,
    };
  }
}
