"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIncidentDto = void 0;
const zod_1 = require("zod");
const severity = zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
class CreateIncidentDto {
    static schema = zod_1.z.object({
        description: zod_1.z.string().min(5).max(1200),
        sessionId: zod_1.z.string().uuid().nullable().optional(),
        sessionItemId: zod_1.z.string().uuid().nullable().optional(),
        severity,
    });
    description;
    sessionId;
    sessionItemId;
    severity;
}
exports.CreateIncidentDto = CreateIncidentDto;
