"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWeekStart = toWeekStart;
function toWeekStart(date) {
    const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = copy.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    copy.setUTCDate(copy.getUTCDate() + delta);
    return copy.toISOString().slice(0, 10);
}
