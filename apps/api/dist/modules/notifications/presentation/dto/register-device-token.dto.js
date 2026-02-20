"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDeviceTokenDto = void 0;
const zod_1 = require("zod");
class RegisterDeviceTokenDto {
    static schema = zod_1.z.object({
        platform: zod_1.z.string().min(2).max(30),
        token: zod_1.z.string().min(10).max(255),
    });
    platform;
    token;
}
exports.RegisterDeviceTokenDto = RegisterDeviceTokenDto;
