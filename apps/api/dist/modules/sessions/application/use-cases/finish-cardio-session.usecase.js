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
exports.FinishCardioSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const emit_session_completed_event_usecase_1 = require("../../../notifications/application/use-cases/emit-session-completed-event.usecase");
const edit_window_policy_1 = require("../../domain/policies/edit-window.policy");
const session_access_policy_1 = require("../../domain/policies/session-access.policy");
const sessions_repository_port_1 = require("../../domain/sessions-repository.port");
let FinishCardioSessionUseCase = class FinishCardioSessionUseCase {
    repository;
    accessPolicy;
    editWindowPolicy;
    emitSessionCompletedEventUseCase;
    constructor(repository, accessPolicy, editWindowPolicy, emitSessionCompletedEventUseCase) {
        this.repository = repository;
        this.accessPolicy = accessPolicy;
        this.editWindowPolicy = editWindowPolicy;
        this.emitSessionCompletedEventUseCase = emitSessionCompletedEventUseCase;
    }
    async execute(context, input, timezoneOffsetMinutes) {
        await this.accessPolicy.assertCanAccess(context, input.sessionId);
        const session = await this.repository.getCardioSessionById(context, input.sessionId);
        if (session) {
            this.editWindowPolicy.assertCanEdit(session.sessionDate, new Date(), timezoneOffsetMinutes);
        }
        const result = await this.repository.finishCardioSession(context, input);
        await this.emitSessionCompletedEventUseCase.execute(result.id);
        return result;
    }
};
exports.FinishCardioSessionUseCase = FinishCardioSessionUseCase;
exports.FinishCardioSessionUseCase = FinishCardioSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_port_1.SESSIONS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, session_access_policy_1.SessionAccessPolicy,
        edit_window_policy_1.EditWindowPolicy,
        emit_session_completed_event_usecase_1.EmitSessionCompletedEventUseCase])
], FinishCardioSessionUseCase);
