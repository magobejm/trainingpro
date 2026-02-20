"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./common/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const chat_module_1 = require("./modules/chat/chat.module");
const clients_module_1 = require("./modules/clients/clients.module");
const coaches_module_1 = require("./modules/coaches/coaches.module");
const files_module_1 = require("./modules/files/files.module");
const health_controller_1 = require("./modules/health/presentation/health.controller");
const library_module_1 = require("./modules/library/library.module");
const maintenance_module_1 = require("./modules/maintenance/maintenance.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const org_module_1 = require("./modules/org/org.module");
const plans_module_1 = require("./modules/plans/plans.module");
const progress_module_1 = require("./modules/progress/progress.module");
const reports_module_1 = require("./modules/reports/reports.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const users_module_1 = require("./modules/users/users.module");
const incidents_module_1 = require("./modules/incidents/incidents.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            files_module_1.FilesModule,
            chat_module_1.ChatModule,
            users_module_1.UsersModule,
            maintenance_module_1.MaintenanceModule,
            notifications_module_1.NotificationsModule,
            org_module_1.OrgModule,
            coaches_module_1.CoachesModule,
            clients_module_1.ClientsModule,
            library_module_1.LibraryModule,
            plans_module_1.PlansModule,
            sessions_module_1.SessionsModule,
            progress_module_1.ProgressModule,
            reports_module_1.ReportsModule,
            incidents_module_1.IncidentsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
