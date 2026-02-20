"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupSessionsByClient = groupSessionsByClient;
exports.isUniqueError = isUniqueError;
exports.mapPreferenceRow = mapPreferenceRow;
exports.toDateOnly = toDateOnly;
exports.toDateKey = toDateKey;
exports.toPrismaTopic = toPrismaTopic;
exports.toJsonValue = toJsonValue;
const library_1 = require("@prisma/client/runtime/library");
function groupSessionsByClient(rows) {
    const buckets = new Map();
    for (const row of rows) {
        const current = buckets.get(row.clientId) ?? createBucket(row);
        current.total += 1;
        if (row.isCompleted) {
            current.completed += 1;
        }
        buckets.set(row.clientId, current);
    }
    return [...buckets.values()];
}
function isUniqueError(error) {
    return error instanceof library_1.PrismaClientKnownRequestError && error.code === 'P2002';
}
function mapPreferenceRow(row) {
    return {
        coachMembershipId: row.coachMembershipId,
        enabled: row.enabled,
        topic: row.topic,
    };
}
function toDateOnly(now) {
    const value = new Date(now);
    value.setHours(0, 0, 0, 0);
    return value;
}
function toDateKey(now) {
    return now.toISOString().slice(0, 10);
}
function toPrismaTopic(topic) {
    return topic;
}
function toJsonValue(value) {
    return value;
}
function createBucket(row) {
    return {
        clientId: row.clientId,
        coachMembershipId: row.coachMembershipId,
        completed: 0,
        organizationId: row.organizationId,
        total: 0,
    };
}
