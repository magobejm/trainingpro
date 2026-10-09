import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { DeactivateDeviceTokenUseCase } from '../../application/use-cases/deactivate-device-token.usecase';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/get-notification-preferences.usecase';
import { RegisterDeviceTokenUseCase } from '../../application/use-cases/register-device-token.usecase';
import { SetNotificationPreferenceUseCase } from '../../application/use-cases/set-notification-preference.usecase';
import { DeviceTokenDto } from '../dto/device-token.dto';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';
import { SetNotificationPreferenceDto } from '../dto/set-notification-preference.dto';

@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly deactivateDeviceTokenUseCase: DeactivateDeviceTokenUseCase,
    private readonly getPreferencesUseCase: GetNotificationPreferencesUseCase,
    private readonly registerDeviceTokenUseCase: RegisterDeviceTokenUseCase,
    private readonly setPreferenceUseCase: SetNotificationPreferenceUseCase,
  ) {}

  @Post('device-token')
  @Roles('coach', 'client')
  registerToken(@Body() body: RegisterDeviceTokenDto, @Req() request: HttpAuthRequest) {
    return this.registerDeviceTokenUseCase.execute(readAuthContext(request), body);
  }

  @Delete('device-token')
  @Roles('coach', 'client')
  deactivateToken(@Body() body: DeviceTokenDto, @Req() request: HttpAuthRequest) {
    return this.deactivateDeviceTokenUseCase.execute(readAuthContext(request), body.token);
  }

  @Get('preferences')
  @Roles('coach')
  listPreferences(@Req() request: HttpAuthRequest) {
    return this.getPreferencesUseCase.execute(readAuthContext(request));
  }

  @Post('preferences')
  @Roles('coach')
  setPreference(@Body() body: SetNotificationPreferenceDto, @Req() request: HttpAuthRequest) {
    return this.setPreferenceUseCase.execute(readAuthContext(request), body.topic, body.enabled);
  }
}
