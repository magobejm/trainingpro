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
exports.BaseOwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../auth-context/read-auth-context");
let BaseOwnershipGuard = class BaseOwnershipGuard {
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authContext = (0, read_auth_context_1.readAuthContext)(request);
        const resourceId = this.readResourceId(request);
        const canAccess = await this.policy.canAccess(authContext, resourceId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('Ownership validation failed');
        }
        return true;
    }
};
exports.BaseOwnershipGuard = BaseOwnershipGuard;
exports.BaseOwnershipGuard = BaseOwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], BaseOwnershipGuard);
