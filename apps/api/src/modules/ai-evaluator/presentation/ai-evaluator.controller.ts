import { Body, Controller, Post, Req, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { readAuthContext } from '../../../common/auth-context/read-auth-context';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../auth/presentation/http-auth-request';
import { EVALUATOR_MAX_BYTES } from '../domain/technique-input.policy';
import { AnalyzeTechniqueUseCase } from '../usecases/analyze-technique.usecase';
import { EvaluatorUploadFilter } from './evaluator-upload.filter';

const attachmentBody = z.object({
  attachmentId: z.string().uuid(),
  exerciseName: z.string().trim().max(120).optional(),
});

@Controller('ai-evaluator')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class AiEvaluatorController {
  constructor(private readonly analyzeUseCase: AnalyzeTechniqueUseCase) {}

  @Post('analyze')
  @UseFilters(EvaluatorUploadFilter)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: EVALUATOR_MAX_BYTES } }))
  async analyze(@UploadedFile() file: Express.Multer.File | undefined, @Body('exerciseName') exerciseName?: string) {
    return this.analyzeUseCase.execute(file, exerciseName);
  }

  @Post('analyze-attachment')
  async analyzeAttachment(@Body() body: unknown, @Req() request: HttpAuthRequest) {
    const parsed = attachmentBody.parse(body);
    return this.analyzeUseCase.executeForAttachment(readAuthContext(request), parsed.attachmentId, parsed.exerciseName);
  }
}
