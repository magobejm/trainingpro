"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronSecretGuard = void 0;
const common_1 = require("@nestjs/common");
let CronSecretGuard = class CronSecretGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const secret = process.env.CRON_SECRET;
        if (!secret) {
            throw new common_1.UnauthorizedException('CRON_SECRET is not configured');
        }
        const headerValue = request.headers['x-cron-secret'];
        if (typeof headerValue !== 'string') {
            throw new common_1.UnauthorizedException('Missing X-CRON-SECRET header');
        }
        if (headerValue !== secret) {
            throw new common_1.ForbiddenException('Invalid cron secret');
        }
        return true;
    }
};
exports.CronSecretGuard = CronSecretGuard;
exports.CronSecretGuard = CronSecretGuard = __decorate([
    (0, common_1.Injectable)()
], CronSecretGuard);
