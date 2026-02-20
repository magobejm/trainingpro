"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryItemIdParamDto = void 0;
const zod_1 = require("zod");
class LibraryItemIdParamDto {
    static schema = zod_1.z.object({
        itemId: zod_1.z.string().uuid(),
    });
    itemId;
}
exports.LibraryItemIdParamDto = LibraryItemIdParamDto;
