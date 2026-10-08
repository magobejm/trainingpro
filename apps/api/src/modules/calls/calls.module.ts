import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateCallProposalUseCase } from './application/use-cases/create-call-proposal.usecase';
import { RespondCallProposalUseCase } from './application/use-cases/respond-call-proposal.usecase';
import { CallsController } from './presentation/controllers/calls.controller';

@Module({
  imports: [AuthModule],
  controllers: [CallsController],
  providers: [CreateCallProposalUseCase, RespondCallProposalUseCase],
})
export class CallsModule {}
