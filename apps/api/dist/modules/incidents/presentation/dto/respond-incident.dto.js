"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RespondIncidentDto = void 0;
const zod_1 = require("zod");
class RespondIncidentDto {
    static schema = zod_1.z.object({
        response: zod_1.z.string().min(2).max(1200),
    });
    response;
}
exports.RespondIncidentDto = RespondIncidentDto;
