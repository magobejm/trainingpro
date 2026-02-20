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
exports.PlansCardioController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const create_cardio_template_usecase_1 = require("../../application/use-cases/create-cardio-template.usecase");
const list_cardio_templates_usecase_1 = require("../../application/use-cases/list-cardio-templates.usecase");
const update_cardio_template_usecase_1 = require("../../application/use-cases/update-cardio-template.usecase");
const plan_template_id_param_dto_1 = require("../dto/plan-template-id-param.dto");
const upsert_cardio_template_dto_1 = require("../dto/upsert-cardio-template.dto");
let PlansCardioController = class PlansCardioController {
    createTemplateUseCase;
    listTemplatesUseCase;
    updateTemplateUseCase;
    constructor(createTemplateUseCase, listTemplatesUseCase, updateTemplateUseCase) {
        this.createTemplateUseCase = createTemplateUseCase;
        this.listTemplatesUseCase = listTemplatesUseCase;
        this.updateTemplateUseCase = updateTemplateUseCase;
    }
    async create(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const template = await this.createTemplateUseCase.execute(auth, body);
        return mapTemplateOutput(template);
    }
    async list(request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const items = await this.listTemplatesUseCase.execute(auth);
        return { items: items.map(mapTemplateOutput) };
    }
    async update(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const template = await this.updateTemplateUseCase.execute(auth, params.templateId, body);
        return mapTemplateOutput(template);
    }
};
exports.PlansCardioController = PlansCardioController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_cardio_template_dto_1.UpsertCardioTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], PlansCardioController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansCardioController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':templateId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [plan_template_id_param_dto_1.PlanTemplateIdParamDto,
        upsert_cardio_template_dto_1.UpsertCardioTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], PlansCardioController.prototype, "update", null);
exports.PlansCardioController = PlansCardioController = __decorate([
    (0, common_1.Controller)('plans/templates/cardio'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach'),
    __metadata("design:paramtypes", [create_cardio_template_usecase_1.CreateCardioTemplateUseCase,
        list_cardio_templates_usecase_1.ListCardioTemplatesUseCase,
        update_cardio_template_usecase_1.UpdateCardioTemplateUseCase])
], PlansCardioController);
function mapTemplateOutput(template) {
    return {
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
    };
}
