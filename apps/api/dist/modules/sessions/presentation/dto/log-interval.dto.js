"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogIntervalDto = void 0;
const zod_1 = require("zod");
class LogIntervalDto {
    static schema = zod_1.z.object({
        avgHeartRate: zod_1.z.number().int().min(30).max(240).nullable().optional(),
        distanceDoneMeters: zod_1.z.number().int().min(0).max(500000).nullable().optional(),
        durationSecondsDone: zod_1.z.number().int().min(0).max(50000).nullable().optional(),
        effortRpe: zod_1.z.number().int().min(1).max(10).nullable().optional(),
        intervalIndex: zod_1.z.number().int().min(1).max(1000),
        sessionCardioBlockId: zod_1.z.string().uuid(),
    });
    avgHeartRate;
    distanceDoneMeters;
    durationSecondsDone;
    effortRpe;
    intervalIndex;
    sessionCardioBlockId;
}
exports.LogIntervalDto = LogIntervalDto;
