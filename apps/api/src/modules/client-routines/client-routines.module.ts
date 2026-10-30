import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientRoutinesController, CoachPresetsController } from './client-routines.controller';
import { ClientRoutinesService } from './client-routines.service';
import { CoachPresetsService } from './coach-presets.service';

@Module({
  controllers: [ClientRoutinesController, CoachPresetsController],
  imports: [AuthModule],
  providers: [ClientRoutinesService, CoachPresetsService],
})
export class ClientRoutinesModule {}
