"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_METADATA_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_METADATA_KEY, roles);
exports.Roles = Roles;
