"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureSessionDto = void 0;
const zod_1 = require("zod");
class EnsureSessionDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid(),
        sessionDate: zod_1.z.string().date(),
        templateId: zod_1.z.string().uuid(),
    });
    clientId;
    sessionDate;
    templateId;
}
exports.EnsureSessionDto = EnsureSessionDto;
