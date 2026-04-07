import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { NOTES_REPOSITORY, type CreateNoteInput, type INotesRepository } from '../../domain/notes.repository.port';

@Injectable()
export class CreateNoteUseCase {
  constructor(
    @Inject(NOTES_REPOSITORY)
    private readonly notesRepository: INotesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, input: CreateNoteInput) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can create notes');
    }
    const membership = await this.readCoachMembership(context.subject);
    return this.notesRepository.create(membership.id, input);
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
