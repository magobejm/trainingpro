"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListChatMessagesQueryDto = void 0;
const zod_1 = require("zod");
class ListChatMessagesQueryDto {
    static schema = zod_1.z.object({
        threadId: zod_1.z.string().uuid(),
    });
    threadId;
}
exports.ListChatMessagesQueryDto = ListChatMessagesQueryDto;
