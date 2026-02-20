"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFoodsQueryDto = void 0;
const zod_1 = require("zod");
class ListFoodsQueryDto {
    static schema = zod_1.z.object({
        foodCategory: zod_1.z.string().trim().max(80).optional(),
        foodType: zod_1.z.string().trim().max(40).optional(),
        query: zod_1.z.string().trim().max(120).optional(),
        servingUnit: zod_1.z.enum(['100g', '100ml', 'porcion']).optional(),
    });
    foodCategory;
    foodType;
    query;
    servingUnit;
}
exports.ListFoodsQueryDto = ListFoodsQueryDto;
