"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const notifications_module_1 = require("../notifications/notifications.module");
const ensure_cardio_session_usecase_1 = require("./application/use-cases/ensure-cardio-session.usecase");
const ensure_session_usecase_1 = require("./application/use-cases/ensure-session.usecase");
const finish_cardio_session_usecase_1 = require("./application/use-cases/finish-cardio-session.usecase");
const finish_session_usecase_1 = require("./application/use-cases/finish-session.usecase");
const get_cardio_session_usecase_1 = require("./application/use-cases/get-cardio-session.usecase");
const get_session_usecase_1 = require("./application/use-cases/get-session.usecase");
const log_interval_usecase_1 = require("./application/use-cases/log-interval.usecase");
const log_set_usecase_1 = require("./application/use-cases/log-set.usecase");
const start_cardio_session_usecase_1 = require("./application/use-cases/start-cardio-session.usecase");
const start_session_usecase_1 = require("./application/use-cases/start-session.usecase");
const edit_window_policy_1 = require("./domain/policies/edit-window.policy");
const session_access_policy_1 = require("./domain/policies/session-access.policy");
const sessions_repository_port_1 = require("./domain/sessions-repository.port");
const sessions_cardio_repository_prisma_1 = require("./infra/prisma/sessions-cardio.repository.prisma");
const sessions_repository_prisma_1 = require("./infra/prisma/sessions.repository.prisma");
const sessions_cardio_controller_1 = require("./presentation/controllers/sessions-cardio.controller");
const sessions_controller_1 = require("./presentation/controllers/sessions.controller");
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, notifications_module_1.NotificationsModule],
        controllers: [sessions_controller_1.SessionsController, sessions_cardio_controller_1.SessionsCardioController],
        providers: [
            ensure_cardio_session_usecase_1.EnsureCardioSessionUseCase,
            ensure_session_usecase_1.EnsureSessionUseCase,
            finish_cardio_session_usecase_1.FinishCardioSessionUseCase,
            finish_session_usecase_1.FinishSessionUseCase,
            get_cardio_session_usecase_1.GetCardioSessionUseCase,
            get_session_usecase_1.GetSessionUseCase,
            log_interval_usecase_1.LogIntervalUseCase,
            log_set_usecase_1.LogSetUseCase,
            start_cardio_session_usecase_1.StartCardioSessionUseCase,
            start_session_usecase_1.StartSessionUseCase,
            edit_window_policy_1.EditWindowPolicy,
            session_access_policy_1.SessionAccessPolicy,
            sessions_cardio_repository_prisma_1.SessionsCardioRepositoryPrisma,
            sessions_repository_prisma_1.SessionsRepositoryPrisma,
            {
                provide: sessions_repository_port_1.SESSIONS_REPOSITORY,
                useExisting: sessions_repository_prisma_1.SessionsRepositoryPrisma,
            },
        ],
    })
], SessionsModule);
