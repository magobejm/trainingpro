"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const role_1 = require("../../domain/role");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_METADATA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Missing authenticated user');
        }
        const activeRole = this.readActiveRole(request);
        const userRoles = new Set(user.roles.map((role) => role.toLowerCase()));
        if (!userRoles.has(activeRole)) {
            throw new common_1.ForbiddenException('Active role is not assigned to authenticated user');
        }
        if (!requiredRoles.includes(activeRole)) {
            throw new common_1.ForbiddenException('Role is not allowed for this endpoint');
        }
        request.activeRole = activeRole;
        return true;
    }
    readActiveRole(request) {
        const rawRole = request.headers['x-active-role'];
        if (typeof rawRole !== 'string') {
            throw new common_1.UnauthorizedException('Missing X-Active-Role header');
        }
        const normalized = rawRole.toLowerCase();
        if (!role_1.APP_ROLES.includes(normalized)) {
            throw new common_1.ForbiddenException('Unsupported active role');
        }
        return normalized;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
