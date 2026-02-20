"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const list_chat_messages_usecase_1 = require("../../application/use-cases/list-chat-messages.usecase");
const resolve_chat_thread_usecase_1 = require("../../application/use-cases/resolve-chat-thread.usecase");
const send_chat_message_usecase_1 = require("../../application/use-cases/send-chat-message.usecase");
const list_chat_messages_query_dto_1 = require("../dto/list-chat-messages-query.dto");
const resolve_chat_thread_query_dto_1 = require("../dto/resolve-chat-thread-query.dto");
const send_chat_message_dto_1 = require("../dto/send-chat-message.dto");
let ChatController = class ChatController {
    listMessagesUseCase;
    resolveThreadUseCase;
    sendMessageUseCase;
    constructor(listMessagesUseCase, resolveThreadUseCase, sendMessageUseCase) {
        this.listMessagesUseCase = listMessagesUseCase;
        this.resolveThreadUseCase = resolveThreadUseCase;
        this.sendMessageUseCase = sendMessageUseCase;
    }
    resolveThread(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.resolveThreadUseCase.execute(auth, query);
    }
    listMessages(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.listMessagesUseCase.execute(auth, query.threadId);
    }
    sendMessage(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.sendMessageUseCase.execute(auth, body);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('thread'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resolve_chat_thread_query_dto_1.ResolveChatThreadQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "resolveThread", null);
__decorate([
    (0, common_1.Get)('messages'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_chat_messages_query_dto_1.ListChatMessagesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_chat_message_dto_1.SendChatMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __metadata("design:paramtypes", [list_chat_messages_usecase_1.ListChatMessagesUseCase,
        resolve_chat_thread_usecase_1.ResolveChatThreadUseCase,
        send_chat_message_usecase_1.SendChatMessageUseCase])
], ChatController);
