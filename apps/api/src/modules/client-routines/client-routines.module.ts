import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientRoutinesController } from './client-routines.controller';
import { ClientRoutinesService } from './client-routines.service';

@Module({
  controllers: [ClientRoutinesController],
  imports: [AuthModule],
  providers: [ClientRoutinesService],
})
export class ClientRoutinesModule {}
