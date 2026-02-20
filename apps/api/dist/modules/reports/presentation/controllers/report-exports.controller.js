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
exports.ReportExportsController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const export_weekly_pdf_usecase_1 = require("../../application/use-cases/export-weekly-pdf.usecase");
const export_weekly_pdf_query_dto_1 = require("../dto/export-weekly-pdf-query.dto");
let ReportExportsController = class ReportExportsController {
    exportWeeklyPdfUseCase;
    constructor(exportWeeklyPdfUseCase) {
        this.exportWeeklyPdfUseCase = exportWeeklyPdfUseCase;
    }
    async exportPdf(query, request, response) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const file = await this.exportWeeklyPdfUseCase.execute(auth, {
            clientId: query.clientId,
            from: new Date(query.from),
            to: new Date(query.to),
        });
        response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        response.setHeader('Content-Type', 'application/pdf');
        return new common_1.StreamableFile(file.data);
    }
};
exports.ReportExportsController = ReportExportsController;
__decorate([
    (0, common_1.Get)('pdf'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_weekly_pdf_query_dto_1.ExportWeeklyPdfQueryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportExportsController.prototype, "exportPdf", null);
exports.ReportExportsController = ReportExportsController = __decorate([
    (0, common_1.Controller)('reports/export'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach'),
    __metadata("design:paramtypes", [export_weekly_pdf_usecase_1.ExportWeeklyPdfUseCase])
], ReportExportsController);
