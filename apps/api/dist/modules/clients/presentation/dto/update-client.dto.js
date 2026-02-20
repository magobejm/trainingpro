"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateClientDto = void 0;
const zod_1 = require("zod");
class UpdateClientDto {
    static schema = zod_1.z.object({
        avatarUrl: zod_1.z.string().url().max(500).nullable().optional(),
        birthDate: zod_1.z.string().date().nullable().optional(),
        email: zod_1.z.string().email().optional(),
        firstName: zod_1.z.string().trim().min(1).max(80).optional(),
        heightCm: zod_1.z.number().int().min(80).max(260).nullable().optional(),
        lastName: zod_1.z.string().trim().min(1).max(80).optional(),
        notes: zod_1.z.string().max(2000).nullable().optional(),
        objectiveId: zod_1.z.string().uuid().nullable().optional(),
        phone: zod_1.z.string().max(30).nullable().optional(),
        sex: zod_1.z.string().max(30).nullable().optional(),
        weightKg: zod_1.z.number().min(20).max(400).nullable().optional(),
    });
    avatarUrl;
    birthDate;
    email;
    firstName;
    heightCm;
    lastName;
    notes;
    objectiveId;
    phone;
    sex;
    weightKg;
}
exports.UpdateClientDto = UpdateClientDto;
