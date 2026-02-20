"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListExercisesQueryDto = void 0;
const zod_1 = require("zod");
class ListExercisesQueryDto {
    static schema = zod_1.z.object({
        muscleGroupId: zod_1.z.string().uuid().optional(),
        query: zod_1.z.string().trim().max(120).optional(),
    });
    muscleGroupId;
    query;
}
exports.ListExercisesQueryDto = ListExercisesQueryDto;
