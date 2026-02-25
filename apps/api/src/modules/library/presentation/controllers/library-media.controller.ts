import {
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { UploadLibraryMediaImageUseCase } from '../../application/use-cases/upload-library-media-image.usecase';

@Controller('library/media-image')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibraryMediaController {
  constructor(private readonly uploadLibraryMediaImageUseCase: UploadLibraryMediaImageUseCase) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMediaImage(
    @Req() request: HttpAuthRequest,
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    const auth = readAuthContext(request);
    if (!file) {
      return { imageUrl: null };
    }
    return this.uploadLibraryMediaImageUseCase.execute(auth, file);
  }
}
