"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListIncidentsQueryDto = void 0;
const zod_1 = require("zod");
const status = zod_1.z.enum(['OPEN', 'REVIEWED', 'CLOSED']);
class ListIncidentsQueryDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid().optional(),
        status: status.optional(),
    });
    clientId;
    status;
}
exports.ListIncidentsQueryDto = ListIncidentsQueryDto;
