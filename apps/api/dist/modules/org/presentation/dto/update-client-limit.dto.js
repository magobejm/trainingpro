"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateClientLimitDto = void 0;
const zod_1 = require("zod");
class UpdateClientLimitDto {
    static schema = zod_1.z.object({
        clientLimit: zod_1.z.number().int().min(0).max(100000),
    });
    clientLimit;
}
exports.UpdateClientLimitDto = UpdateClientLimitDto;
