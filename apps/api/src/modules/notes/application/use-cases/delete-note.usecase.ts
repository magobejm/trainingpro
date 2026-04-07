import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { NOTES_REPOSITORY, type INotesRepository } from '../../domain/notes.repository.port';

@Injectable()
export class DeleteNoteUseCase {
  constructor(
    @Inject(NOTES_REPOSITORY)
    private readonly notesRepository: INotesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, noteId: string): Promise<void> {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can delete notes');
    }
    const membership = await this.readCoachMembership(context.subject);
    await this.notesRepository.delete(noteId, membership.id);
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
