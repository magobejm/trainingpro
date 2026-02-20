"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSession = mapSession;
exports.normalizeText = normalizeText;
exports.sessionInclude = sessionInclude;
exports.toDecimal = toDecimal;
const client_1 = require("@prisma/client");
function mapSession(row) {
    return {
        clientId: row.clientId,
        finishComment: row.finishComment,
        finishedAt: row.finishedAt,
        id: row.id,
        isCompleted: row.isCompleted,
        isIncomplete: row.isIncomplete,
        items: row.items.map((item) => ({
            displayName: item.displayName,
            id: item.id,
            repsMax: item.repsMax,
            repsMin: item.repsMin,
            setsPlanned: item.setsPlanned,
            sortOrder: item.sortOrder,
        })),
        sessionDate: row.sessionDate,
        startedAt: row.startedAt,
        status: row.status,
        templateId: row.sourceTemplateId,
        templateVersion: row.sourceTemplateVersion,
    };
}
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
function sessionInclude() {
    return {
        items: {
            orderBy: { sortOrder: 'asc' },
            where: { archivedAt: null },
        },
    };
}
function toDecimal(value) {
    return typeof value === 'number' ? new client_1.Prisma.Decimal(value) : null;
}
