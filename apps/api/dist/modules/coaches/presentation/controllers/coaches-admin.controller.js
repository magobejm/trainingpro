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
exports.CoachesAdminController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const activate_coach_usecase_1 = require("../../application/activate-coach.usecase");
const archive_coach_usecase_1 = require("../../application/archive-coach.usecase");
const create_coach_usecase_1 = require("../../application/create-coach.usecase");
const deactivate_coach_usecase_1 = require("../../application/deactivate-coach.usecase");
const list_coaches_usecase_1 = require("../../application/list-coaches.usecase");
const coach_id_param_dto_1 = require("../dto/coach-id-param.dto");
const create_coach_dto_1 = require("../dto/create-coach.dto");
let CoachesAdminController = class CoachesAdminController {
    activateCoachUseCase;
    archiveCoachUseCase;
    createCoachUseCase;
    deactivateCoachUseCase;
    listCoachesUseCase;
    constructor(activateCoachUseCase, archiveCoachUseCase, createCoachUseCase, deactivateCoachUseCase, listCoachesUseCase) {
        this.activateCoachUseCase = activateCoachUseCase;
        this.archiveCoachUseCase = archiveCoachUseCase;
        this.createCoachUseCase = createCoachUseCase;
        this.deactivateCoachUseCase = deactivateCoachUseCase;
        this.listCoachesUseCase = listCoachesUseCase;
    }
    list(request) {
        return this.listCoachesUseCase.execute(readAdminUid(request));
    }
    create(body, request) {
        return this.createCoachUseCase.execute(readAdminUid(request), body);
    }
    activate(params, request) {
        return this.activateCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
    }
    deactivate(params, request) {
        return this.deactivateCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
    }
    archive(params, request) {
        return this.archiveCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
    }
};
exports.CoachesAdminController = CoachesAdminController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CoachesAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_coach_dto_1.CreateCoachDto, Object]),
    __metadata("design:returntype", void 0)
], CoachesAdminController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':coachMembershipId/activate'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coach_id_param_dto_1.CoachIdParamDto, Object]),
    __metadata("design:returntype", void 0)
], CoachesAdminController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':coachMembershipId/deactivate'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coach_id_param_dto_1.CoachIdParamDto, Object]),
    __metadata("design:returntype", void 0)
], CoachesAdminController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Delete)(':coachMembershipId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coach_id_param_dto_1.CoachIdParamDto, Object]),
    __metadata("design:returntype", void 0)
], CoachesAdminController.prototype, "archive", null);
exports.CoachesAdminController = CoachesAdminController = __decorate([
    (0, common_1.Controller)('coaches'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [activate_coach_usecase_1.ActivateCoachUseCase,
        archive_coach_usecase_1.ArchiveCoachUseCase,
        create_coach_usecase_1.CreateCoachUseCase,
        deactivate_coach_usecase_1.DeactivateCoachUseCase,
        list_coaches_usecase_1.ListCoachesUseCase])
], CoachesAdminController);
function readAdminUid(request) {
    return request.user?.subject ?? '';
}
