"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const emit_incident_critical_event_usecase_1 = require("./application/use-cases/emit-incident-critical-event.usecase");
const emit_session_completed_event_usecase_1 = require("./application/use-cases/emit-session-completed-event.usecase");
const get_notification_preferences_usecase_1 = require("./application/use-cases/get-notification-preferences.usecase");
const register_device_token_usecase_1 = require("./application/use-cases/register-device-token.usecase");
const run_notification_batch_jobs_usecase_1 = require("./application/use-cases/run-notification-batch-jobs.usecase");
const set_notification_preference_usecase_1 = require("./application/use-cases/set-notification-preference.usecase");
const notifications_repository_port_1 = require("./domain/notifications.repository.port");
const notifications_repository_prisma_1 = require("./infra/prisma/notifications.repository.prisma");
const notifications_controller_1 = require("./presentation/controllers/notifications.controller");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [
            emit_incident_critical_event_usecase_1.EmitIncidentCriticalEventUseCase,
            emit_session_completed_event_usecase_1.EmitSessionCompletedEventUseCase,
            get_notification_preferences_usecase_1.GetNotificationPreferencesUseCase,
            register_device_token_usecase_1.RegisterDeviceTokenUseCase,
            run_notification_batch_jobs_usecase_1.RunNotificationBatchJobsUseCase,
            set_notification_preference_usecase_1.SetNotificationPreferenceUseCase,
            notifications_repository_prisma_1.NotificationsRepositoryPrisma,
            {
                provide: notifications_repository_port_1.NOTIFICATIONS_REPOSITORY,
                useExisting: notifications_repository_prisma_1.NotificationsRepositoryPrisma,
            },
        ],
        exports: [
            emit_incident_critical_event_usecase_1.EmitIncidentCriticalEventUseCase,
            emit_session_completed_event_usecase_1.EmitSessionCompletedEventUseCase,
            run_notification_batch_jobs_usecase_1.RunNotificationBatchJobsUseCase,
        ],
    })
], NotificationsModule);
