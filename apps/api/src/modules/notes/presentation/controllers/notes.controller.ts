import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateNoteUseCase } from '../../application/use-cases/create-note.usecase';
import { DeleteNoteUseCase } from '../../application/use-cases/delete-note.usecase';
import { ListNotesUseCase } from '../../application/use-cases/list-notes.usecase';
import { UpdateNoteUseCase } from '../../application/use-cases/update-note.usecase';
import { CreateNoteDto } from '../dto/create-note.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';
import { NoteIdParamDto } from '../dto/note-id-param.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';

@Controller('notes')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class NotesController {
  constructor(
    private readonly createNoteUseCase: CreateNoteUseCase,
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
    private readonly listNotesUseCase: ListNotesUseCase,
    private readonly updateNoteUseCase: UpdateNoteUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateNoteDto, @Req() request: HttpAuthRequest) {
    return this.createNoteUseCase.execute(readAuthContext(request), body);
  }

  @Get()
  async list(@Query() query: ListNotesQueryDto, @Req() request: HttpAuthRequest) {
    const parsedQuery = {
      ...query,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };
    return this.listNotesUseCase.execute(readAuthContext(request), parsedQuery);
  }

  @Patch(':noteId')
  async update(@Param() params: NoteIdParamDto, @Body() body: UpdateNoteDto, @Req() request: HttpAuthRequest) {
    return this.updateNoteUseCase.execute(readAuthContext(request), params.noteId, body);
  }

  @Delete(':noteId')
  async delete(@Param() params: NoteIdParamDto, @Req() request: HttpAuthRequest) {
    await this.deleteNoteUseCase.execute(readAuthContext(request), params.noteId);
    return { success: true };
  }
}
