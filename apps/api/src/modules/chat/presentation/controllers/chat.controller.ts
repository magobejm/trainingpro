import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ListChatMessagesUseCase } from '../../application/use-cases/list-chat-messages.usecase';
import { ResolveChatThreadUseCase } from '../../application/use-cases/resolve-chat-thread.usecase';
import { SendChatMessageUseCase } from '../../application/use-cases/send-chat-message.usecase';
import { ListChatMessagesQueryDto } from '../dto/list-chat-messages-query.dto';
import { ResolveChatThreadQueryDto } from '../dto/resolve-chat-thread-query.dto';
import { SendChatMessageDto } from '../dto/send-chat-message.dto';

@Controller('chat')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class ChatController {
  constructor(
    private readonly listMessagesUseCase: ListChatMessagesUseCase,
    private readonly resolveThreadUseCase: ResolveChatThreadUseCase,
    private readonly sendMessageUseCase: SendChatMessageUseCase,
  ) {}

  @Get('thread')
  resolveThread(@Query() query: ResolveChatThreadQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.resolveThreadUseCase.execute(auth, query);
  }

  @Get('messages')
  listMessages(@Query() query: ListChatMessagesQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.listMessagesUseCase.execute(auth, query.threadId);
  }

  @Post('messages')
  sendMessage(@Body() body: SendChatMessageDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.sendMessageUseCase.execute(auth, body);
  }
}
