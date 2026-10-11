import { Body, Controller, Post, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { EVALUATOR_MAX_BYTES } from '../domain/technique-input.policy';
import { AnalyzeTechniqueUseCase } from '../usecases/analyze-technique.usecase';
import { EvaluatorUploadFilter } from './evaluator-upload.filter';

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
}
