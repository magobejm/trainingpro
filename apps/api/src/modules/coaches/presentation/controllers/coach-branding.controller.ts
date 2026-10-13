import { Body, Controller, Delete, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CoachBrandingService } from '../../application/coach-branding.service';

@Controller('coaches/me/branding')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CoachBrandingController {
  constructor(private readonly branding: CoachBrandingService) {}

  @Get()
  get(@Req() request: HttpAuthRequest) { return this.branding.get(readAuthContext(request)); }

  @Patch()
  patch(@Req() request: HttpAuthRequest, @Body() body: unknown) {
    return this.branding.patch(readAuthContext(request), body);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024, files: 1 } }))
  upload(@Req() request: HttpAuthRequest, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.branding.uploadLogo(readAuthContext(request), file);
  }

  @Delete('logo')
  remove(@Req() request: HttpAuthRequest) { return this.branding.removeLogo(readAuthContext(request)); }
}
