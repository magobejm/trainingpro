"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogSetDto = void 0;
const zod_1 = require("zod");
class LogSetDto {
    static schema = zod_1.z.object({
        effortRpe: zod_1.z.number().int().min(1).max(10).nullable().optional(),
        repsDone: zod_1.z.number().int().min(0).max(200).nullable().optional(),
        sessionItemId: zod_1.z.string().uuid(),
        setIndex: zod_1.z.number().int().min(1).max(100),
        weightDoneKg: zod_1.z.number().min(0).max(1000).nullable().optional(),
    });
    effortRpe;
    repsDone;
    sessionItemId;
    setIndex;
    weightDoneKg;
}
exports.LogSetDto = LogSetDto;
