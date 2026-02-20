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
exports.ArchiveCoachUseCase = void 0;
const common_1 = require("@nestjs/common");
const coach_admin_repository_port_1 = require("../domain/coach-admin.repository.port");
let ArchiveCoachUseCase = class ArchiveCoachUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    execute(adminSupabaseUid, coachMembershipId) {
        return this.repository.archiveCoach(adminSupabaseUid, coachMembershipId);
    }
};
exports.ArchiveCoachUseCase = ArchiveCoachUseCase;
exports.ArchiveCoachUseCase = ArchiveCoachUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(coach_admin_repository_port_1.COACH_ADMIN_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ArchiveCoachUseCase);
