"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionIdParamDto = void 0;
const zod_1 = require("zod");
class SessionIdParamDto {
    static schema = zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    });
    sessionId;
}
exports.SessionIdParamDto = SessionIdParamDto;
