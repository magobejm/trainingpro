"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreateAuditFields = buildCreateAuditFields;
exports.buildUpdateAuditFields = buildUpdateAuditFields;
exports.buildArchiveAuditFields = buildArchiveAuditFields;
function buildCreateAuditFields(context) {
    return {
        createdBy: context.subject,
        updatedBy: context.subject,
    };
}
function buildUpdateAuditFields(context) {
    return {
        updatedBy: context.subject,
    };
}
function buildArchiveAuditFields(context) {
    return {
        archivedAt: new Date(),
        archivedBy: context.subject,
        updatedBy: context.subject,
    };
}
