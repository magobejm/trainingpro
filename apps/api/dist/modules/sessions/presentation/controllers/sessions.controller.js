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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const ensure_session_usecase_1 = require("../../application/use-cases/ensure-session.usecase");
const finish_session_usecase_1 = require("../../application/use-cases/finish-session.usecase");
const get_session_usecase_1 = require("../../application/use-cases/get-session.usecase");
const log_set_usecase_1 = require("../../application/use-cases/log-set.usecase");
const start_session_usecase_1 = require("../../application/use-cases/start-session.usecase");
const ensure_session_dto_1 = require("../dto/ensure-session.dto");
const finish_session_dto_1 = require("../dto/finish-session.dto");
const log_set_dto_1 = require("../dto/log-set.dto");
const session_id_param_dto_1 = require("../dto/session-id-param.dto");
let SessionsController = class SessionsController {
    ensureSessionUseCase;
    finishSessionUseCase;
    getSessionUseCase;
    logSetUseCase;
    startSessionUseCase;
    constructor(ensureSessionUseCase, finishSessionUseCase, getSessionUseCase, logSetUseCase, startSessionUseCase) {
        this.ensureSessionUseCase = ensureSessionUseCase;
        this.finishSessionUseCase = finishSessionUseCase;
        this.getSessionUseCase = getSessionUseCase;
        this.logSetUseCase = logSetUseCase;
        this.startSessionUseCase = startSessionUseCase;
    }
    async ensure(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.ensureSessionUseCase.execute(auth, {
            clientId: body.clientId,
            sessionDate: new Date(body.sessionDate),
            templateId: body.templateId,
        });
        return mapSession(session);
    }
    async start(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.startSessionUseCase.execute(auth, params.sessionId);
        return mapSession(session);
    }
    async logSet(params, body, request, timezoneOffset) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const entry = await this.logSetUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
        return entry;
    }
    async finish(params, body, request, timezoneOffset) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.finishSessionUseCase.execute(auth, { comment: body.comment, isIncomplete: body.isIncomplete, sessionId: params.sessionId }, readOffset(timezoneOffset));
        return mapSession(session);
    }
    async getOne(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.getSessionUseCase.execute(auth, params.sessionId);
        return mapSession(session);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)('ensure'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ensure_session_dto_1.EnsureSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "ensure", null);
__decorate([
    (0, common_1.Post)(':sessionId/start'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':sessionId/log-set'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)('x-timezone-offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto,
        log_set_dto_1.LogSetDto, Object, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "logSet", null);
__decorate([
    (0, common_1.Post)(':sessionId/finish'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)('x-timezone-offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto,
        finish_session_dto_1.FinishSessionDto, Object, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "finish", null);
__decorate([
    (0, common_1.Get)(':sessionId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getOne", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('sessions/strength'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __metadata("design:paramtypes", [ensure_session_usecase_1.EnsureSessionUseCase,
        finish_session_usecase_1.FinishSessionUseCase,
        get_session_usecase_1.GetSessionUseCase,
        log_set_usecase_1.LogSetUseCase,
        start_session_usecase_1.StartSessionUseCase])
], SessionsController);
function mapSession(session) {
    return {
        ...session,
        finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
        sessionDate: session.sessionDate.toISOString().slice(0, 10),
        startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    };
}
function readOffset(raw) {
    if (!raw) {
        return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
}
