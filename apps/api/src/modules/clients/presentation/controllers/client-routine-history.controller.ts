import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { compareRoutineContent } from '@trainerpro/shared';
import { z } from 'zod';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ClientOwnershipGuard } from '../guards/client-ownership.guard';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { readRoutineContent } from '../../../plans/infra/prisma/routine-revision.prisma';

@Controller('clients/:clientId/routine-assignments')
@UseGuards(AuthGuard, RolesGuard, ClientOwnershipGuard)
@Roles('coach')
export class ClientRoutineHistoryController {
  constructor(private readonly db: PrismaService) {}

  @Get('current')
  async current(@Param() params: ClientIdParamDto) {
    const client = await this.db.client.findUniqueOrThrow({
      where: { id: params.clientId },
      include: { activeRoutineAssignment: { include: { revision: true } } },
    });
    return (
      client.activeRoutineAssignment?.revision.content ??
      (client.trainingPlanId ? await readRoutineContent(this.db, client.trainingPlanId) : null)
    );
  }

  @Get()
  async list(@Param() params: ClientIdParamDto, @Query('before') rawBefore?: string) {
    const before = z.string().uuid().optional().parse(rawBefore);
    const cursor = before
      ? await this.db.routineAssignment.findFirst({ where: { id: before, clientId: params.clientId } })
      : null;
    if (before && !cursor) throw new NotFoundException('Assignment not found');
    const client = await this.db.client.findUniqueOrThrow({ where: { id: params.clientId } });
    const rows = await this.db.routineAssignment.findMany({
      where: { clientId: params.clientId },
      include: { revision: { select: { name: true, templateId: true, version: true } } },
      orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
      take: 21,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
    });
    return {
      items: rows.slice(0, 20).map((row) => ({
        id: row.id,
        name: row.revision.name,
        templateId: row.revision.templateId,
        version: row.revision.version,
        appliedAt: row.appliedAt.toISOString(),
        initial: row.initial,
        active: row.id === client.activeRoutineAssignmentId,
      })),
      nextCursor: rows.length > 20 ? rows[19]!.id : null,
    };
  }

  @Get(':assignmentId')
  async detail(@Param() params: { clientId: string; assignmentId: string }) {
    const id = z.string().uuid().parse(params.assignmentId);
    const row = await this.db.routineAssignment.findFirst({
      where: { id, clientId: params.clientId },
      include: { revision: true },
    });
    if (!row) throw new NotFoundException('Assignment not found');
    const client = await this.db.client.findUniqueOrThrow({
      where: { id: params.clientId },
      include: { activeRoutineAssignment: { include: { revision: true } } },
    });
    return {
      content: row.revision.content,
      comparison: compareRoutineContent(row.revision.content, client.activeRoutineAssignment?.revision.content ?? null),
    };
  }
}
