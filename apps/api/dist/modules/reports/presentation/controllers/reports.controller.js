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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const get_weekly_report_usecase_1 = require("../../application/use-cases/get-weekly-report.usecase");
const upsert_weekly_report_usecase_1 = require("../../application/use-cases/upsert-weekly-report.usecase");
const get_weekly_report_query_dto_1 = require("../dto/get-weekly-report-query.dto");
const upsert_weekly_report_dto_1 = require("../dto/upsert-weekly-report.dto");
let ReportsController = class ReportsController {
    getWeeklyReportUseCase;
    upsertWeeklyReportUseCase;
    constructor(getWeeklyReportUseCase, upsertWeeklyReportUseCase) {
        this.getWeeklyReportUseCase = getWeeklyReportUseCase;
        this.upsertWeeklyReportUseCase = upsertWeeklyReportUseCase;
    }
    async getOne(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const report = await this.getWeeklyReportUseCase.execute(auth, new Date(query.reportDate));
        return mapWeeklyReport(report);
    }
    async upsert(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const report = await this.upsertWeeklyReportUseCase.execute(auth, {
            adherencePercent: body.adherencePercent,
            energy: body.energy,
            mood: body.mood,
            notes: body.notes,
            reportDate: new Date(body.reportDate),
            sleepHours: body.sleepHours,
            sourceSessionId: body.sourceSessionId,
        });
        return mapWeeklyReport(report);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_weekly_report_query_dto_1.GetWeeklyReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_weekly_report_dto_1.UpsertWeeklyReportDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "upsert", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports/weekly'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('client'),
    __metadata("design:paramtypes", [get_weekly_report_usecase_1.GetWeeklyReportUseCase,
        upsert_weekly_report_usecase_1.UpsertWeeklyReportUseCase])
], ReportsController);
function mapWeeklyReport(report) {
    if (!report) {
        return null;
    }
    return {
        ...report,
        reportDate: report.reportDate.toISOString().slice(0, 10),
        weekStartDate: report.weekStartDate.toISOString().slice(0, 10),
    };
}
