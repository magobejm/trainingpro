"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansRulesService = void 0;
const common_1 = require("@nestjs/common");
let PlansRulesService = class PlansRulesService {
    assertValidTemplate(input) {
        for (const day of input.days) {
            for (const exercise of day.exercises) {
                this.assertValidPrescription(exercise);
            }
        }
    }
    assertValidPrescription(exercise) {
        const hasRange = typeof exercise.weightRangeMinKg === 'number' || typeof exercise.weightRangeMaxKg === 'number';
        const hasPerSet = (exercise.perSetWeightRanges?.length ?? 0) > 0;
        if (!hasRange && !hasPerSet) {
            throw new common_1.BadRequestException('Strength exercise must define weight range and/or per-set ranges');
        }
    }
};
exports.PlansRulesService = PlansRulesService;
exports.PlansRulesService = PlansRulesService = __decorate([
    (0, common_1.Injectable)()
], PlansRulesService);
