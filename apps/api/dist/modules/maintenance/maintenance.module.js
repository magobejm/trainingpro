"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceModule = void 0;
const common_1 = require("@nestjs/common");
const files_module_1 = require("../files/files.module");
const notifications_module_1 = require("../notifications/notifications.module");
const purge_expired_chat_data_usecase_1 = require("./application/use-cases/purge-expired-chat-data.usecase");
const chat_ttl_repository_port_1 = require("./domain/chat-ttl.repository.port");
const chat_ttl_repository_prisma_1 = require("./infra/prisma/chat-ttl.repository.prisma");
const maintenance_controller_1 = require("./presentation/controllers/maintenance.controller");
const cron_secret_guard_1 = require("./presentation/guards/cron-secret.guard");
let MaintenanceModule = class MaintenanceModule {
};
exports.MaintenanceModule = MaintenanceModule;
exports.MaintenanceModule = MaintenanceModule = __decorate([
    (0, common_1.Module)({
        imports: [files_module_1.FilesModule, notifications_module_1.NotificationsModule],
        controllers: [maintenance_controller_1.MaintenanceController],
        providers: [
            cron_secret_guard_1.CronSecretGuard,
            purge_expired_chat_data_usecase_1.PurgeExpiredChatDataUseCase,
            chat_ttl_repository_prisma_1.ChatTtlRepositoryPrisma,
            {
                provide: chat_ttl_repository_port_1.CHAT_TTL_REPOSITORY,
                useExisting: chat_ttl_repository_prisma_1.ChatTtlRepositoryPrisma,
            },
        ],
    })
], MaintenanceModule);
