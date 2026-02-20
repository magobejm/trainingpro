"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveChatThreadQueryDto = void 0;
const zod_1 = require("zod");
class ResolveChatThreadQueryDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid().optional(),
    });
    clientId;
}
exports.ResolveChatThreadQueryDto = ResolveChatThreadQueryDto;
