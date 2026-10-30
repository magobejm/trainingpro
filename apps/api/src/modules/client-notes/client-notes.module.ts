import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientNotesController } from './client-notes.controller';
import { ClientNotesService } from './client-notes.service';

@Module({
  controllers: [ClientNotesController],
  imports: [AuthModule],
  providers: [ClientNotesService],
})
export class ClientNotesModule {}
