"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardioRulesService = void 0;
const common_1 = require("@nestjs/common");
let CardioRulesService = class CardioRulesService {
    assertValidTemplate(input) {
        if (input.name.trim().length === 0) {
            throw new common_1.BadRequestException('Template name cannot be empty');
        }
        for (const day of input.days) {
            this.assertValidDay(day.cardioBlocks);
        }
    }
    assertValidDay(blocks) {
        if (blocks.length === 0) {
            throw new common_1.BadRequestException('Cardio day must include at least one block');
        }
        for (const block of blocks) {
            this.assertValidBlock(block);
        }
    }
    assertValidBlock(block) {
        if (block.workSeconds <= 0) {
            throw new common_1.BadRequestException('workSeconds must be greater than zero');
        }
        if ((block.restSeconds ?? 0) < 0) {
            throw new common_1.BadRequestException('restSeconds cannot be negative');
        }
        if ((block.roundsPlanned ?? 1) <= 0) {
            throw new common_1.BadRequestException('roundsPlanned must be greater than zero');
        }
        if (!isDistanceAllowed(block.methodType) && block.targetDistanceMeters != null) {
            throw new common_1.BadRequestException('Selected cardio method does not support distance target');
        }
    }
};
exports.CardioRulesService = CardioRulesService;
exports.CardioRulesService = CardioRulesService = __decorate([
    (0, common_1.Injectable)()
], CardioRulesService);
function isDistanceAllowed(methodType) {
    if (!methodType) {
        return true;
    }
    const normalized = methodType.trim().toUpperCase();
    return normalized !== 'HIIT' && normalized !== 'TABATA';
}
