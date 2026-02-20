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
exports.StartCardioSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const session_access_policy_1 = require("../../domain/policies/session-access.policy");
const sessions_repository_port_1 = require("../../domain/sessions-repository.port");
let StartCardioSessionUseCase = class StartCardioSessionUseCase {
    repository;
    accessPolicy;
    constructor(repository, accessPolicy) {
        this.repository = repository;
        this.accessPolicy = accessPolicy;
    }
    async execute(context, sessionId) {
        await this.accessPolicy.assertCanAccess(context, sessionId);
        return this.repository.startCardioSession(context, sessionId);
    }
};
exports.StartCardioSessionUseCase = StartCardioSessionUseCase;
exports.StartCardioSessionUseCase = StartCardioSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_port_1.SESSIONS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, session_access_policy_1.SessionAccessPolicy])
], StartCardioSessionUseCase);
