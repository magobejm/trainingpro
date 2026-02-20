"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinishSessionDto = void 0;
const zod_1 = require("zod");
class FinishSessionDto {
    static schema = zod_1.z.object({
        comment: zod_1.z.string().max(2000).nullable().optional(),
        isIncomplete: zod_1.z.boolean(),
    });
    comment;
    isIncomplete;
}
exports.FinishSessionDto = FinishSessionDto;
