"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapClient = mapClient;
exports.mapObjective = mapObjective;
exports.normalizeCreateInput = normalizeCreateInput;
exports.normalizeUpdateInput = normalizeUpdateInput;
const client_1 = require("@prisma/client");
function mapClient(row) {
    return {
        avatarUrl: row.avatarUrl,
        birthDate: row.birthDate,
        coachMembershipId: row.coachMembershipId,
        createdAt: row.createdAt,
        email: row.email,
        firstName: row.firstName,
        heightCm: row.heightCm,
        id: row.id,
        lastName: row.lastName,
        notes: row.notes,
        objective: row.objectiveRef.label,
        objectiveId: row.objectiveId,
        organizationId: row.organizationId,
        phone: row.phone,
        sex: row.sex,
        updatedAt: row.updatedAt,
        weightKg: row.weightKg ? Number(row.weightKg) : null,
    };
}
function mapObjective(row) {
    return {
        code: row.code,
        id: row.id,
        isDefault: row.isDefault,
        label: row.label,
        sortOrder: row.sortOrder,
    };
}
function normalizeCreateInput(input) {
    return {
        avatarUrl: input.avatarUrl ?? null,
        birthDate: input.birthDate ?? null,
        clientSupabaseUid: input.clientSupabaseUid,
        email: input.email.trim().toLowerCase(),
        firstName: input.firstName.trim(),
        heightCm: input.heightCm ?? null,
        lastName: input.lastName.trim(),
        notes: input.notes ?? null,
        objectiveId: input.objectiveId ?? null,
        phone: input.phone ?? null,
        sex: input.sex ?? null,
        weightKg: toDecimal(input.weightKg),
    };
}
function normalizeUpdateInput(input) {
    const payload = {};
    assignIfDefined(payload, 'avatarUrl', input.avatarUrl);
    assignIfDefined(payload, 'birthDate', input.birthDate);
    assignIfDefined(payload, 'heightCm', input.heightCm);
    assignIfDefined(payload, 'notes', input.notes);
    assignIfDefined(payload, 'phone', input.phone);
    assignIfDefined(payload, 'sex', input.sex);
    assignIfDefined(payload, 'weightKg', toDecimal(input.weightKg));
    if (input.email !== undefined) {
        payload.email = input.email.trim().toLowerCase();
    }
    if (input.firstName !== undefined) {
        payload.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
        payload.lastName = input.lastName.trim();
    }
    return payload;
}
function assignIfDefined(payload, key, value) {
    if (value !== undefined) {
        payload[key] = value;
    }
}
function toDecimal(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return new client_1.Prisma.Decimal(value);
}
