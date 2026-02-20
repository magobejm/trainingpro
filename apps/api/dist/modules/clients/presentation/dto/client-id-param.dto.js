"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientIdParamDto = void 0;
const zod_1 = require("zod");
class ClientIdParamDto {
    static schema = zod_1.z.object({
        clientId: zod_1.z.string().uuid(),
    });
    clientId;
}
exports.ClientIdParamDto = ClientIdParamDto;
