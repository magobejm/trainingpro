"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWeeklyReportQueryDto = void 0;
const zod_1 = require("zod");
class GetWeeklyReportQueryDto {
    static schema = zod_1.z.object({
        reportDate: zod_1.z.string().date(),
    });
    reportDate;
}
exports.GetWeeklyReportQueryDto = GetWeeklyReportQueryDto;
