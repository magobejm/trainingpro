"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportPolicy = void 0;
const common_1 = require("@nestjs/common");
class WeeklyReportPolicy {
    ensureSessionDateMatchesReportDate(reportDate, sessionDate) {
        if (toDateKey(reportDate) !== toDateKey(sessionDate)) {
            throw new common_1.BadRequestException('Post-session weekly report must match session day');
        }
    }
    resolveWeekStart(reportDate) {
        const start = new Date(Date.UTC(reportDate.getUTCFullYear(), reportDate.getUTCMonth(), reportDate.getUTCDate()));
        const day = start.getUTCDay();
        const offset = day === 0 ? -6 : 1 - day;
        start.setUTCDate(start.getUTCDate() + offset);
        return start;
    }
}
exports.WeeklyReportPolicy = WeeklyReportPolicy;
function toDateKey(value) {
    return value.toISOString().slice(0, 10);
}
