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
exports.UpdateCardioTemplateUseCase = void 0;
const common_1 = require("@nestjs/common");
const cardio_rules_service_1 = require("../../domain/cardio-rules.service");
const plans_repository_port_1 = require("../../domain/plans-repository.port");
let UpdateCardioTemplateUseCase = class UpdateCardioTemplateUseCase {
    repository;
    rulesService;
    constructor(repository, rulesService) {
        this.repository = repository;
        this.rulesService = rulesService;
    }
    execute(context, templateId, input) {
        this.rulesService.assertValidTemplate(input);
        return this.repository.updateCardioTemplate(context, templateId, input);
    }
};
exports.UpdateCardioTemplateUseCase = UpdateCardioTemplateUseCase;
exports.UpdateCardioTemplateUseCase = UpdateCardioTemplateUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(plans_repository_port_1.PLANS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, cardio_rules_service_1.CardioRulesService])
], UpdateCardioTemplateUseCase);
