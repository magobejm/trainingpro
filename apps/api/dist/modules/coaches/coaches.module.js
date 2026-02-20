"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachesModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const activate_coach_usecase_1 = require("./application/activate-coach.usecase");
const archive_coach_usecase_1 = require("./application/archive-coach.usecase");
const create_coach_usecase_1 = require("./application/create-coach.usecase");
const deactivate_coach_usecase_1 = require("./application/deactivate-coach.usecase");
const list_coaches_usecase_1 = require("./application/list-coaches.usecase");
const coach_admin_repository_port_1 = require("./domain/coach-admin.repository.port");
const coach_admin_repository_prisma_1 = require("./infra/prisma/coach-admin.repository.prisma");
const coaches_admin_controller_1 = require("./presentation/controllers/coaches-admin.controller");
let CoachesModule = class CoachesModule {
};
exports.CoachesModule = CoachesModule;
exports.CoachesModule = CoachesModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [coaches_admin_controller_1.CoachesAdminController],
        providers: [
            activate_coach_usecase_1.ActivateCoachUseCase,
            archive_coach_usecase_1.ArchiveCoachUseCase,
            create_coach_usecase_1.CreateCoachUseCase,
            deactivate_coach_usecase_1.DeactivateCoachUseCase,
            list_coaches_usecase_1.ListCoachesUseCase,
            coach_admin_repository_prisma_1.CoachAdminRepositoryPrisma,
            {
                provide: coach_admin_repository_port_1.COACH_ADMIN_REPOSITORY,
                useExisting: coach_admin_repository_prisma_1.CoachAdminRepositoryPrisma,
            },
        ],
    })
], CoachesModule);
