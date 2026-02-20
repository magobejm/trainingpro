"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentDraftDto = void 0;
const zod_1 = require("zod");
class AdjustmentDraftDto {
    static schema = zod_1.z.object({
        draft: zod_1.z.string().min(2).max(1200),
    });
    draft;
}
exports.AdjustmentDraftDto = AdjustmentDraftDto;
