import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiEvaluatorController } from './presentation/ai-evaluator.controller';
import { AnalyzeTechniqueUseCase } from './usecases/analyze-technique.usecase';

@Module({
  controllers: [AiEvaluatorController],
  imports: [AuthModule],
  providers: [AnalyzeTechniqueUseCase],
})
export class AiEvaluatorModule {}
