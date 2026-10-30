import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../auth/presentation/http-auth-request';
import { ClientNotesService } from './client-notes.service';

function check<T extends ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }
  return parsed.data;
}

const category = z.enum(['EXERCISE', 'OTHER']);
const createBody = z.object({
  category,
  exerciseLibraryId: z.string().uuid().nullable().optional(),
  exerciseName: z.string().trim().max(120).nullable().optional(),
  sessionId: z.string().uuid().nullable().optional(),
  sessionItemId: z.string().uuid().nullable().optional(),
  text: z.string().trim().min(1).max(2000),
});
const listQuery = z.object({ category: category.optional(), clientId: z.string().uuid() });

@Controller('client-notes')
@UseGuards(AuthGuard, RolesGuard)
export class ClientNotesController {
  constructor(private readonly service: ClientNotesService) {}

  @Post()
  @Roles('client')
  create(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    return this.service.create(readAuthContext(request), check(createBody, body));
  }

  @Get()
  @Roles('coach')
  list(@Query() query: unknown, @Req() request: HttpAuthRequest) {
    return this.service.list(readAuthContext(request), check(listQuery, query));
  }
}
