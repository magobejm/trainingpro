import { BadRequestException, Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { FILE_MAX_SIZE_BYTES } from '../../../files/domain/file.constants';
import { CreateUploadPolicyUseCase } from '../../application/use-cases/create-upload-policy.usecase';
import { UploadChatFileUseCase } from '../../application/use-cases/upload-chat-file.usecase';
import { CreateUploadPolicyDto } from '../dto/create-upload-policy.dto';

type UploadedChatBody = {
  threadId?: string;
};

type UploadedChatPayload = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Controller('files')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class ChatUploadPolicyController {
  constructor(
    private readonly createUploadPolicyUseCase: CreateUploadPolicyUseCase,
    private readonly uploadChatFileUseCase: UploadChatFileUseCase,
  ) {}

  @Post('upload-policy')
  createPolicy(@Body() body: CreateUploadPolicyDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.createUploadPolicyUseCase.execute(auth, body);
  }

  @Post('chat-upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: FILE_MAX_SIZE_BYTES } }))
  uploadChatFile(
    @UploadedFile() file: UploadedChatPayload | undefined,
    @Body() body: UploadedChatBody,
    @Req() request: HttpAuthRequest,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Missing chat file');
    }
    const auth = readAuthContext(request);
    return this.uploadChatFileUseCase.execute(auth, {
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      threadId: body.threadId ?? '',
    });
  }
}
