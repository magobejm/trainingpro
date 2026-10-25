import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { FilesModule } from '../files/files.module';
import { AiEvaluatorController } from './presentation/ai-evaluator.controller';
import { AnalyzeTechniqueUseCase } from './usecases/analyze-technique.usecase';

@Module({
  controllers: [AiEvaluatorController],
  imports: [AiModule, AuthModule, ChatModule, FilesModule],
  providers: [AnalyzeTechniqueUseCase],
})
export class AiEvaluatorModule {}
