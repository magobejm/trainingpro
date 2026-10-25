import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';

@Module({
  controllers: [CopilotController],
  imports: [AiModule, AuthModule],
  providers: [CopilotService],
})
export class CopilotModule {}
