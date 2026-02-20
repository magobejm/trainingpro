"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditWindowPolicy = void 0;
const common_1 = require("@nestjs/common");
let EditWindowPolicy = class EditWindowPolicy {
    assertCanEdit(sessionDate, now, timezoneOffsetMinutes) {
        const end = computeSessionDayEnd(sessionDate, timezoneOffsetMinutes);
        if (now.getTime() > end.getTime()) {
            throw new common_1.ForbiddenException('Session edit window has expired');
        }
    }
};
exports.EditWindowPolicy = EditWindowPolicy;
exports.EditWindowPolicy = EditWindowPolicy = __decorate([
    (0, common_1.Injectable)()
], EditWindowPolicy);
function computeSessionDayEnd(sessionDate, timezoneOffsetMinutes) {
    const utcDate = new Date(sessionDate.getTime());
    const shifted = new Date(utcDate.getTime() - timezoneOffsetMinutes * 60_000);
    shifted.setUTCHours(23, 59, 59, 999);
    return new Date(shifted.getTime() + timezoneOffsetMinutes * 60_000);
}
