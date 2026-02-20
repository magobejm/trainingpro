"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const notifications_module_1 = require("../notifications/notifications.module");
const add_adjustment_draft_usecase_1 = require("./application/use-cases/add-adjustment-draft.usecase");
const create_incident_usecase_1 = require("./application/use-cases/create-incident.usecase");
const list_incidents_usecase_1 = require("./application/use-cases/list-incidents.usecase");
const mark_incident_reviewed_usecase_1 = require("./application/use-cases/mark-incident-reviewed.usecase");
const respond_incident_usecase_1 = require("./application/use-cases/respond-incident.usecase");
const tag_incident_usecase_1 = require("./application/use-cases/tag-incident.usecase");
const incidents_repository_port_1 = require("./domain/incidents.repository.port");
const incidents_repository_prisma_1 = require("./infra/prisma/incidents.repository.prisma");
const incidents_controller_1 = require("./presentation/controllers/incidents.controller");
let IncidentsModule = class IncidentsModule {
};
exports.IncidentsModule = IncidentsModule;
exports.IncidentsModule = IncidentsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, notifications_module_1.NotificationsModule],
        controllers: [incidents_controller_1.IncidentsController],
        providers: [
            add_adjustment_draft_usecase_1.AddAdjustmentDraftUseCase,
            create_incident_usecase_1.CreateIncidentUseCase,
            list_incidents_usecase_1.ListIncidentsUseCase,
            mark_incident_reviewed_usecase_1.MarkIncidentReviewedUseCase,
            respond_incident_usecase_1.RespondIncidentUseCase,
            tag_incident_usecase_1.TagIncidentUseCase,
            incidents_repository_prisma_1.IncidentsRepositoryPrisma,
            {
                provide: incidents_repository_port_1.INCIDENTS_REPOSITORY,
                useExisting: incidents_repository_prisma_1.IncidentsRepositoryPrisma,
            },
        ],
    })
], IncidentsModule);
