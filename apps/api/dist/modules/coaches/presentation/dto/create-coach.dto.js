"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCoachDto = void 0;
const zod_1 = require("zod");
class CreateCoachDto {
    static schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        supabaseUid: zod_1.z.string().uuid(),
    });
    email;
    supabaseUid;
}
exports.CreateCoachDto = CreateCoachDto;
