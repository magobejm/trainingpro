"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeHeadersDto = void 0;
const zod_1 = require("zod");
class MeHeadersDto {
    static schema = zod_1.z
        .object({
        'x-active-role': zod_1.z.enum(['admin', 'coach', 'client']),
    })
        .passthrough();
    'x-active-role';
}
exports.MeHeadersDto = MeHeadersDto;
