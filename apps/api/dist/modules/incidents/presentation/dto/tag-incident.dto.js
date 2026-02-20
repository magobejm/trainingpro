"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagIncidentDto = void 0;
const zod_1 = require("zod");
class TagIncidentDto {
    static schema = zod_1.z.object({
        tag: zod_1.z.string().min(2).max(60),
    });
    tag;
}
exports.TagIncidentDto = TagIncidentDto;
