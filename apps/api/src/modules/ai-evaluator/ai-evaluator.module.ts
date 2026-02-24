import { Module } from '@nestjs/common';
import { AiEvaluatorController } from './presentation/ai-evaluator.controller';
import { AnalyzeTechniqueUseCase } from './usecases/analyze-technique.usecase';

@Module({
  controllers: [AiEvaluatorController],
  providers: [AnalyzeTechniqueUseCase],
})
export class AiEvaluatorModule {}
