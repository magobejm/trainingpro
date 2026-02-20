"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportWeeklyPdfQueryDto = void 0;
const zod_1 = require("zod");
class ExportWeeklyPdfQueryDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid(),
        from: zod_1.z.string().date(),
        to: zod_1.z.string().date(),
    });
    clientId;
    from;
    to;
}
exports.ExportWeeklyPdfQueryDto = ExportWeeklyPdfQueryDto;
