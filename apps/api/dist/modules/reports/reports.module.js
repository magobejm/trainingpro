"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const export_weekly_pdf_usecase_1 = require("./application/use-cases/export-weekly-pdf.usecase");
const auth_module_1 = require("../auth/auth.module");
const get_weekly_report_usecase_1 = require("./application/use-cases/get-weekly-report.usecase");
const upsert_weekly_report_usecase_1 = require("./application/use-cases/upsert-weekly-report.usecase");
const weekly_report_policy_1 = require("./domain/policies/weekly-report.policy");
const reports_repository_port_1 = require("./domain/reports.repository.port");
const reports_repository_prisma_1 = require("./infra/prisma/reports.repository.prisma");
const report_exports_controller_1 = require("./presentation/controllers/report-exports.controller");
const reports_controller_1 = require("./presentation/controllers/reports.controller");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [reports_controller_1.ReportsController, report_exports_controller_1.ReportExportsController],
        providers: [
            export_weekly_pdf_usecase_1.ExportWeeklyPdfUseCase,
            get_weekly_report_usecase_1.GetWeeklyReportUseCase,
            upsert_weekly_report_usecase_1.UpsertWeeklyReportUseCase,
            weekly_report_policy_1.WeeklyReportPolicy,
            reports_repository_prisma_1.ReportsRepositoryPrisma,
            {
                provide: reports_repository_port_1.REPORTS_REPOSITORY,
                useExisting: reports_repository_prisma_1.ReportsRepositoryPrisma,
            },
        ],
    })
], ReportsModule);
