import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeTechniqueUseCase } from '../usecases/analyze-technique.usecase';

@Controller('ai-evaluator')
export class AiEvaluatorController {
    constructor(private readonly analyzeUseCase: AnalyzeTechniqueUseCase) { }

    @Post('analyze')
    @UseInterceptors(FileInterceptor('file'))
    async analyze(
        @UploadedFile() file: Express.Multer.File,
        @Body('exerciseName') exerciseName?: string,
    ) {
        return this.analyzeUseCase.execute(file, exerciseName);
    }
}
