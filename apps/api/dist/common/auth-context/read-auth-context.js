"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAuthContext = readAuthContext;
const common_1 = require("@nestjs/common");
const role_1 = require("../../modules/auth/domain/role");
function normalizeRole(role) {
    if (!role_1.APP_ROLES.includes(role)) {
        return null;
    }
    return role;
}
function readAuthContext(request) {
    if (!request.user) {
        throw new common_1.UnauthorizedException('Missing authenticated user in request');
    }
    if (!request.activeRole) {
        throw new common_1.UnauthorizedException('Missing active role in request');
    }
    const roles = request.user.roles
        .map((role) => role.toLowerCase())
        .map((role) => normalizeRole(role))
        .filter((role) => role !== null);
    if (!roles.includes(request.activeRole)) {
        throw new common_1.ForbiddenException('Active role is not part of authenticated user roles');
    }
    return {
        activeRole: request.activeRole,
        email: request.user.email,
        roles,
        subject: request.user.subject,
    };
}
