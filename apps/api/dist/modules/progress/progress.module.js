"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const get_progress_overview_usecase_1 = require("./application/use-cases/get-progress-overview.usecase");
const progress_repository_port_1 = require("./domain/progress-repository.port");
const progress_repository_prisma_1 = require("./infra/prisma/progress.repository.prisma");
const progress_controller_1 = require("./presentation/controllers/progress.controller");
let ProgressModule = class ProgressModule {
};
exports.ProgressModule = ProgressModule;
exports.ProgressModule = ProgressModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [progress_controller_1.ProgressController],
        providers: [
            get_progress_overview_usecase_1.GetProgressOverviewUseCase,
            progress_repository_prisma_1.ProgressRepositoryPrisma,
            {
                provide: progress_repository_port_1.PROGRESS_REPOSITORY,
                useExisting: progress_repository_prisma_1.ProgressRepositoryPrisma,
            },
        ],
    })
], ProgressModule);
