import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { NOTES_REPOSITORY, type INotesRepository, type ListNotesQuery } from '../../domain/notes.repository.port';

@Injectable()
export class ListNotesUseCase {
  constructor(
    @Inject(NOTES_REPOSITORY)
    private readonly notesRepository: INotesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, query: ListNotesQuery) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can list notes');
    }
    const membership = await this.readCoachMembership(context.subject);
    const notes = await this.notesRepository.list(membership.id, query);
    return { data: notes };
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: subject },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }
}
