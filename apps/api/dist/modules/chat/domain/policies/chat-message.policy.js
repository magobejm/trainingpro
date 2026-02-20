"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagePolicy = void 0;
const common_1 = require("@nestjs/common");
const chat_constants_1 = require("../chat.constants");
let ChatMessagePolicy = class ChatMessagePolicy {
    ensureMessagePayload(input) {
        const text = input.text?.trim() ?? '';
        const attachmentsCount = input.attachments?.length ?? 0;
        if (text.length === 0 && attachmentsCount === 0) {
            throw new common_1.BadRequestException('Message requires text or attachments');
        }
        if (text.length > chat_constants_1.CHAT_MAX_MESSAGE_CHARS) {
            throw new common_1.BadRequestException('Message text exceeds max length');
        }
    }
    resolveExpiryDate(now) {
        const expiresAt = new Date(now);
        expiresAt.setUTCDate(expiresAt.getUTCDate() + chat_constants_1.CHAT_RETENTION_DAYS);
        return expiresAt;
    }
};
exports.ChatMessagePolicy = ChatMessagePolicy;
exports.ChatMessagePolicy = ChatMessagePolicy = __decorate([
    (0, common_1.Injectable)()
], ChatMessagePolicy);
