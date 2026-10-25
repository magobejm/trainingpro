import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { CoachHomeController } from './coach-home.controller';
import { CoachTriageService } from './coach-triage.service';

@Module({
  controllers: [CoachHomeController],
  imports: [AuthModule, IntegrationsModule],
  providers: [CoachTriageService],
})
export class CoachHomeModule {}
