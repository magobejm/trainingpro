"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTemplateIdParamDto = void 0;
const zod_1 = require("zod");
class PlanTemplateIdParamDto {
    static schema = zod_1.z.object({
        templateId: zod_1.z.string().uuid(),
    });
    templateId;
}
exports.PlanTemplateIdParamDto = PlanTemplateIdParamDto;
