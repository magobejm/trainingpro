import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateUploadPolicyUseCase } from '../../application/use-cases/create-upload-policy.usecase';
import { CreateUploadPolicyDto } from '../dto/create-upload-policy.dto';

@Controller('files')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class FilesController {
  constructor(private readonly createUploadPolicyUseCase: CreateUploadPolicyUseCase) {}

  @Post('upload-policy')
  createPolicy(@Body() body: CreateUploadPolicyDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.createUploadPolicyUseCase.execute(auth, body);
  }
}
