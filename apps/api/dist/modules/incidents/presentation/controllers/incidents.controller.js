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
exports.IncidentsController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const add_adjustment_draft_usecase_1 = require("../../application/use-cases/add-adjustment-draft.usecase");
const create_incident_usecase_1 = require("../../application/use-cases/create-incident.usecase");
const list_incidents_usecase_1 = require("../../application/use-cases/list-incidents.usecase");
const mark_incident_reviewed_usecase_1 = require("../../application/use-cases/mark-incident-reviewed.usecase");
const respond_incident_usecase_1 = require("../../application/use-cases/respond-incident.usecase");
const tag_incident_usecase_1 = require("../../application/use-cases/tag-incident.usecase");
const adjustment_draft_dto_1 = require("../dto/adjustment-draft.dto");
const create_incident_dto_1 = require("../dto/create-incident.dto");
const incident_id_param_dto_1 = require("../dto/incident-id-param.dto");
const list_incidents_query_dto_1 = require("../dto/list-incidents-query.dto");
const respond_incident_dto_1 = require("../dto/respond-incident.dto");
const tag_incident_dto_1 = require("../dto/tag-incident.dto");
let IncidentsController = class IncidentsController {
    addAdjustmentDraftUseCase;
    createIncidentUseCase;
    listIncidentsUseCase;
    markIncidentReviewedUseCase;
    respondIncidentUseCase;
    tagIncidentUseCase;
    constructor(addAdjustmentDraftUseCase, createIncidentUseCase, listIncidentsUseCase, markIncidentReviewedUseCase, respondIncidentUseCase, tagIncidentUseCase) {
        this.addAdjustmentDraftUseCase = addAdjustmentDraftUseCase;
        this.createIncidentUseCase = createIncidentUseCase;
        this.listIncidentsUseCase = listIncidentsUseCase;
        this.markIncidentReviewedUseCase = markIncidentReviewedUseCase;
        this.respondIncidentUseCase = respondIncidentUseCase;
        this.tagIncidentUseCase = tagIncidentUseCase;
    }
    async create(body, request) {
        return this.createIncidentUseCase.execute((0, read_auth_context_1.readAuthContext)(request), body);
    }
    async list(query, request) {
        return this.listIncidentsUseCase.execute((0, read_auth_context_1.readAuthContext)(request), query);
    }
    async review(params, request) {
        return this.markIncidentReviewedUseCase.execute((0, read_auth_context_1.readAuthContext)(request), params.incidentId);
    }
    async respond(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.respondIncidentUseCase.execute(auth, params.incidentId, body.response);
    }
    async tag(params, body, request) {
        return this.tagIncidentUseCase.execute((0, read_auth_context_1.readAuthContext)(request), params.incidentId, body.tag);
    }
    async adjustmentDraft(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.addAdjustmentDraftUseCase.execute(auth, params.incidentId, body.draft);
    }
};
exports.IncidentsController = IncidentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('client'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_incident_dto_1.CreateIncidentDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_incidents_query_dto_1.ListIncidentsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':incidentId/review'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [incident_id_param_dto_1.IncidentIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "review", null);
__decorate([
    (0, common_1.Post)(':incidentId/respond'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [incident_id_param_dto_1.IncidentIdParamDto,
        respond_incident_dto_1.RespondIncidentDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "respond", null);
__decorate([
    (0, common_1.Post)(':incidentId/tag'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [incident_id_param_dto_1.IncidentIdParamDto,
        tag_incident_dto_1.TagIncidentDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "tag", null);
__decorate([
    (0, common_1.Post)(':incidentId/adjustment-draft'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [incident_id_param_dto_1.IncidentIdParamDto,
        adjustment_draft_dto_1.AdjustmentDraftDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "adjustmentDraft", null);
exports.IncidentsController = IncidentsController = __decorate([
    (0, common_1.Controller)('incidents'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __metadata("design:paramtypes", [add_adjustment_draft_usecase_1.AddAdjustmentDraftUseCase,
        create_incident_usecase_1.CreateIncidentUseCase,
        list_incidents_usecase_1.ListIncidentsUseCase,
        mark_incident_reviewed_usecase_1.MarkIncidentReviewedUseCase,
        respond_incident_usecase_1.RespondIncidentUseCase,
        tag_incident_usecase_1.TagIncidentUseCase])
], IncidentsController);
