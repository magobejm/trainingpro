"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentIdParamDto = void 0;
const zod_1 = require("zod");
class IncidentIdParamDto {
    static schema = zod_1.z.object({
        incidentId: zod_1.z.string().uuid(),
    });
    incidentId;
}
exports.IncidentIdParamDto = IncidentIdParamDto;
