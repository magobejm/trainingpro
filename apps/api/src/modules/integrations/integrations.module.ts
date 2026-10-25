import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import {
  ClientIntegrationsController,
  CoachIntegrationsController,
  PublicIntegrationsController,
} from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  controllers: [ClientIntegrationsController, CoachIntegrationsController, PublicIntegrationsController],
  exports: [IntegrationsService],
  imports: [AuthModule, ClientsModule],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
