import { Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import { GetMeUseCase } from '../application/get-me.usecase';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../auth/presentation/http-auth-request';
import { MeHeadersDto } from './dto/me-headers.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly getMeUseCase: GetMeUseCase) {}

  @Get('me')
  @Roles('admin', 'coach', 'client')
  @UseGuards(AuthGuard, RolesGuard)
  async getMe(
    @Headers() headers: MeHeadersDto,
    @Req() request: HttpAuthRequest,
  ): Promise<{ email: string; roles: string[] }> {
    const user = request.user;
    if (!user) {
      return {
        email: '',
        roles: [],
      };
    }
    const activeRole = headers['x-active-role'];
    const profile = await this.getMeUseCase.execute(user);
    void activeRole;
    return {
      email: profile.email,
      roles: profile.roles,
    };
  }
}
