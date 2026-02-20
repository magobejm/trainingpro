"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachIdParamDto = void 0;
const zod_1 = require("zod");
class CoachIdParamDto {
    static schema = zod_1.z.object({
        coachMembershipId: zod_1.z.string().uuid(),
    });
    coachMembershipId;
}
exports.CoachIdParamDto = CoachIdParamDto;
