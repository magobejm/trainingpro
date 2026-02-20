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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const run_notification_batch_jobs_usecase_1 = require("../../../notifications/application/use-cases/run-notification-batch-jobs.usecase");
const purge_expired_chat_data_usecase_1 = require("../../application/use-cases/purge-expired-chat-data.usecase");
const cron_secret_guard_1 = require("../guards/cron-secret.guard");
let MaintenanceController = class MaintenanceController {
    purgeExpiredChatDataUseCase;
    runNotificationBatchJobsUseCase;
    constructor(purgeExpiredChatDataUseCase, runNotificationBatchJobsUseCase) {
        this.purgeExpiredChatDataUseCase = purgeExpiredChatDataUseCase;
        this.runNotificationBatchJobsUseCase = runNotificationBatchJobsUseCase;
    }
    async dispatch() {
        const chatPurge = await this.purgeExpiredChatDataUseCase.execute();
        const notificationJobs = await this.runNotificationBatchJobsUseCase.execute();
        return { chatPurge, notificationJobs, status: 'accepted' };
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Post)('dispatch'),
    (0, common_1.UseGuards)(cron_secret_guard_1.CronSecretGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "dispatch", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, common_1.Controller)('maintenance'),
    __metadata("design:paramtypes", [purge_expired_chat_data_usecase_1.PurgeExpiredChatDataUseCase,
        run_notification_batch_jobs_usecase_1.RunNotificationBatchJobsUseCase])
], MaintenanceController);
