"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const list_chat_messages_usecase_1 = require("./application/use-cases/list-chat-messages.usecase");
const resolve_chat_thread_usecase_1 = require("./application/use-cases/resolve-chat-thread.usecase");
const send_chat_message_usecase_1 = require("./application/use-cases/send-chat-message.usecase");
const chat_repository_port_1 = require("./domain/chat.repository.port");
const chat_message_policy_1 = require("./domain/policies/chat-message.policy");
const chat_repository_prisma_1 = require("./infra/prisma/chat.repository.prisma");
const chat_controller_1 = require("./presentation/controllers/chat.controller");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [chat_controller_1.ChatController],
        providers: [
            chat_message_policy_1.ChatMessagePolicy,
            list_chat_messages_usecase_1.ListChatMessagesUseCase,
            resolve_chat_thread_usecase_1.ResolveChatThreadUseCase,
            send_chat_message_usecase_1.SendChatMessageUseCase,
            chat_repository_prisma_1.ChatRepositoryPrisma,
            {
                provide: chat_repository_port_1.CHAT_REPOSITORY,
                useExisting: chat_repository_prisma_1.ChatRepositoryPrisma,
            },
        ],
        exports: [chat_repository_port_1.CHAT_REPOSITORY],
    })
], ChatModule);
