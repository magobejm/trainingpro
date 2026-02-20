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
exports.LogSetUseCase = void 0;
const common_1 = require("@nestjs/common");
const edit_window_policy_1 = require("../../domain/policies/edit-window.policy");
const session_access_policy_1 = require("../../domain/policies/session-access.policy");
const sessions_repository_port_1 = require("../../domain/sessions-repository.port");
let LogSetUseCase = class LogSetUseCase {
    repository;
    accessPolicy;
    editWindowPolicy;
    constructor(repository, accessPolicy, editWindowPolicy) {
        this.repository = repository;
        this.accessPolicy = accessPolicy;
        this.editWindowPolicy = editWindowPolicy;
    }
    async execute(context, input, timezoneOffsetMinutes) {
        await this.accessPolicy.assertCanAccess(context, input.sessionId);
        const session = await this.repository.getSessionById(context, input.sessionId);
        if (session) {
            this.editWindowPolicy.assertCanEdit(session.sessionDate, new Date(), timezoneOffsetMinutes);
        }
        return this.repository.logSet(context, input);
    }
};
exports.LogSetUseCase = LogSetUseCase;
exports.LogSetUseCase = LogSetUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_port_1.SESSIONS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, session_access_policy_1.SessionAccessPolicy,
        edit_window_policy_1.EditWindowPolicy])
], LogSetUseCase);
