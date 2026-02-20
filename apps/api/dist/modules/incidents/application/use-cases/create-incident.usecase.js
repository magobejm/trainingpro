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
exports.CreateIncidentUseCase = void 0;
const common_1 = require("@nestjs/common");
const emit_incident_critical_event_usecase_1 = require("../../../notifications/application/use-cases/emit-incident-critical-event.usecase");
const incidents_repository_port_1 = require("../../domain/incidents.repository.port");
let CreateIncidentUseCase = class CreateIncidentUseCase {
    incidentsRepository;
    emitIncidentCriticalEventUseCase;
    constructor(incidentsRepository, emitIncidentCriticalEventUseCase) {
        this.incidentsRepository = incidentsRepository;
        this.emitIncidentCriticalEventUseCase = emitIncidentCriticalEventUseCase;
    }
    async execute(context, input) {
        const incident = await this.incidentsRepository.createIncident(context, input);
        if (incident.severity === 'CRITICAL') {
            await this.emitIncidentCriticalEventUseCase.execute(incident.id);
        }
        return incident;
    }
};
exports.CreateIncidentUseCase = CreateIncidentUseCase;
exports.CreateIncidentUseCase = CreateIncidentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(incidents_repository_port_1.INCIDENTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, emit_incident_critical_event_usecase_1.EmitIncidentCriticalEventUseCase])
], CreateIncidentUseCase);
