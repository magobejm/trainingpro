"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProgressQueryDto = void 0;
const zod_1 = require("zod");
class GetProgressQueryDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid().optional(),
        from: zod_1.z.string().date(),
        to: zod_1.z.string().date(),
    });
    clientId;
    from;
    to;
}
exports.GetProgressQueryDto = GetProgressQueryDto;
