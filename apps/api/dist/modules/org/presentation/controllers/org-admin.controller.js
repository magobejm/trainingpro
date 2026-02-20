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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgAdminController = void 0;
const common_1 = require("@nestjs/common");
const update_client_limit_usecase_1 = require("../../application/update-client-limit.usecase");
const get_org_occupancy_usecase_1 = require("../../application/get-org-occupancy.usecase");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const update_client_limit_dto_1 = require("../dto/update-client-limit.dto");
let OrgAdminController = class OrgAdminController {
    getOrgOccupancyUseCase;
    updateClientLimitUseCase;
    constructor(getOrgOccupancyUseCase, updateClientLimitUseCase) {
        this.getOrgOccupancyUseCase = getOrgOccupancyUseCase;
        this.updateClientLimitUseCase = updateClientLimitUseCase;
    }
    async getOccupancy(request) {
        const adminUid = request.user?.subject ?? '';
        return this.getOrgOccupancyUseCase.execute(adminUid);
    }
    async setClientLimit(body, request) {
        const adminUid = request.user?.subject ?? '';
        return this.updateClientLimitUseCase.execute(adminUid, body.clientLimit);
    }
};
exports.OrgAdminController = OrgAdminController;
__decorate([
    (0, common_1.Get)('occupancy'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgAdminController.prototype, "getOccupancy", null);
__decorate([
    (0, common_1.Patch)('limit'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_client_limit_dto_1.UpdateClientLimitDto, Object]),
    __metadata("design:returntype", Promise)
], OrgAdminController.prototype, "setClientLimit", null);
exports.OrgAdminController = OrgAdminController = __decorate([
    (0, common_1.Controller)('org/subscription'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [get_org_occupancy_usecase_1.GetOrgOccupancyUseCase,
        update_client_limit_usecase_1.UpdateClientLimitUseCase])
], OrgAdminController);
