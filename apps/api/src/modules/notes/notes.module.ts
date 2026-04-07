import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateNoteUseCase } from './application/use-cases/create-note.usecase';
import { DeleteNoteUseCase } from './application/use-cases/delete-note.usecase';
import { ListNotesUseCase } from './application/use-cases/list-notes.usecase';
import { UpdateNoteUseCase } from './application/use-cases/update-note.usecase';
import { NOTES_REPOSITORY } from './domain/notes.repository.port';
import { NotesRepositoryPrisma } from './infra/prisma/notes.repository.prisma';
import { NotesController } from './presentation/controllers/notes.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotesController],
  providers: [
    CreateNoteUseCase,
    DeleteNoteUseCase,
    ListNotesUseCase,
    UpdateNoteUseCase,
    NotesRepositoryPrisma,
    {
      provide: NOTES_REPOSITORY,
      useExisting: NotesRepositoryPrisma,
    },
  ],
})
export class NotesModule {}
