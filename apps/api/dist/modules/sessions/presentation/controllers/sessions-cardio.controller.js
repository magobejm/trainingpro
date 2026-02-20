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
exports.SessionsCardioController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const ensure_cardio_session_usecase_1 = require("../../application/use-cases/ensure-cardio-session.usecase");
const finish_cardio_session_usecase_1 = require("../../application/use-cases/finish-cardio-session.usecase");
const get_cardio_session_usecase_1 = require("../../application/use-cases/get-cardio-session.usecase");
const log_interval_usecase_1 = require("../../application/use-cases/log-interval.usecase");
const start_cardio_session_usecase_1 = require("../../application/use-cases/start-cardio-session.usecase");
const ensure_cardio_session_dto_1 = require("../dto/ensure-cardio-session.dto");
const finish_session_dto_1 = require("../dto/finish-session.dto");
const log_interval_dto_1 = require("../dto/log-interval.dto");
const session_id_param_dto_1 = require("../dto/session-id-param.dto");
let SessionsCardioController = class SessionsCardioController {
    ensureCardioSessionUseCase;
    finishCardioSessionUseCase;
    getCardioSessionUseCase;
    logIntervalUseCase;
    startCardioSessionUseCase;
    constructor(ensureCardioSessionUseCase, finishCardioSessionUseCase, getCardioSessionUseCase, logIntervalUseCase, startCardioSessionUseCase) {
        this.ensureCardioSessionUseCase = ensureCardioSessionUseCase;
        this.finishCardioSessionUseCase = finishCardioSessionUseCase;
        this.getCardioSessionUseCase = getCardioSessionUseCase;
        this.logIntervalUseCase = logIntervalUseCase;
        this.startCardioSessionUseCase = startCardioSessionUseCase;
    }
    async ensure(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.ensureCardioSessionUseCase.execute(auth, {
            clientId: body.clientId,
            sessionDate: new Date(body.sessionDate),
            templateId: body.templateId,
        });
        return mapSession(session);
    }
    async start(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.startCardioSessionUseCase.execute(auth, params.sessionId);
        return mapSession(session);
    }
    async logInterval(params, body, request, timezoneOffset) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.logIntervalUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
    }
    async finish(params, body, request, timezoneOffset) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.finishCardioSessionUseCase.execute(auth, { comment: body.comment, isIncomplete: body.isIncomplete, sessionId: params.sessionId }, readOffset(timezoneOffset));
        return mapSession(session);
    }
    async getOne(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const session = await this.getCardioSessionUseCase.execute(auth, params.sessionId);
        return mapSession(session);
    }
};
exports.SessionsCardioController = SessionsCardioController;
__decorate([
    (0, common_1.Post)('ensure'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ensure_cardio_session_dto_1.EnsureCardioSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsCardioController.prototype, "ensure", null);
__decorate([
    (0, common_1.Post)(':sessionId/start'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsCardioController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':sessionId/log-interval'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)('x-timezone-offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto,
        log_interval_dto_1.LogIntervalDto, Object, String]),
    __metadata("design:returntype", Promise)
], SessionsCardioController.prototype, "logInterval", null);
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
], SessionsCardioController.prototype, "finish", null);
__decorate([
    (0, common_1.Get)(':sessionId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_id_param_dto_1.SessionIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsCardioController.prototype, "getOne", null);
exports.SessionsCardioController = SessionsCardioController = __decorate([
    (0, common_1.Controller)('sessions/cardio'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __metadata("design:paramtypes", [ensure_cardio_session_usecase_1.EnsureCardioSessionUseCase,
        finish_cardio_session_usecase_1.FinishCardioSessionUseCase,
        get_cardio_session_usecase_1.GetCardioSessionUseCase,
        log_interval_usecase_1.LogIntervalUseCase,
        start_cardio_session_usecase_1.StartCardioSessionUseCase])
], SessionsCardioController);
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
