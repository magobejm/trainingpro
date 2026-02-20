"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureCardioSessionDto = void 0;
const zod_1 = require("zod");
class EnsureCardioSessionDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid(),
        sessionDate: zod_1.z.string().date(),
        templateId: zod_1.z.string().uuid(),
    });
    clientId;
    sessionDate;
    templateId;
}
exports.EnsureCardioSessionDto = EnsureCardioSessionDto;
