"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCardioMethodsQueryDto = void 0;
const zod_1 = require("zod");
class ListCardioMethodsQueryDto {
    static schema = zod_1.z.object({
        methodTypeId: zod_1.z.string().uuid().optional(),
        query: zod_1.z.string().trim().max(120).optional(),
    });
    methodTypeId;
    query;
}
exports.ListCardioMethodsQueryDto = ListCardioMethodsQueryDto;
