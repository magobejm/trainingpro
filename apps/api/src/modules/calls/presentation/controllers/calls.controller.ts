import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateCallProposalUseCase } from '../../application/use-cases/create-call-proposal.usecase';
import { RespondCallProposalUseCase } from '../../application/use-cases/respond-call-proposal.usecase';
import { CounterCallProposalDto, ProposalIdParamDto } from '../dto/counter-call-proposal.dto';
import { CreateCallProposalDto } from '../dto/create-call-proposal.dto';

@Controller('calls')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class CallsController {
  constructor(
    private readonly createCallProposalUseCase: CreateCallProposalUseCase,
    private readonly respondCallProposalUseCase: RespondCallProposalUseCase,
  ) {}

  @Post('proposals')
  create(@Body() body: CreateCallProposalDto, @Req() request: HttpAuthRequest) {
    return this.createCallProposalUseCase.execute(readAuthContext(request), body);
  }

  @Post('proposals/:proposalId/accept')
  accept(@Param() params: ProposalIdParamDto, @Req() request: HttpAuthRequest) {
    return this.respondCallProposalUseCase.accept(readAuthContext(request), params.proposalId);
  }

  @Post('proposals/:proposalId/counter')
  counter(@Param() params: ProposalIdParamDto, @Body() body: CounterCallProposalDto, @Req() request: HttpAuthRequest) {
    return this.respondCallProposalUseCase.counter(readAuthContext(request), params.proposalId, body.time);
  }
}
