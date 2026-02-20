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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const get_notification_preferences_usecase_1 = require("../../application/use-cases/get-notification-preferences.usecase");
const register_device_token_usecase_1 = require("../../application/use-cases/register-device-token.usecase");
const set_notification_preference_usecase_1 = require("../../application/use-cases/set-notification-preference.usecase");
const register_device_token_dto_1 = require("../dto/register-device-token.dto");
const set_notification_preference_dto_1 = require("../dto/set-notification-preference.dto");
let NotificationsController = class NotificationsController {
    getPreferencesUseCase;
    registerDeviceTokenUseCase;
    setPreferenceUseCase;
    constructor(getPreferencesUseCase, registerDeviceTokenUseCase, setPreferenceUseCase) {
        this.getPreferencesUseCase = getPreferencesUseCase;
        this.registerDeviceTokenUseCase = registerDeviceTokenUseCase;
        this.setPreferenceUseCase = setPreferenceUseCase;
    }
    registerToken(body, request) {
        return this.registerDeviceTokenUseCase.execute((0, read_auth_context_1.readAuthContext)(request), body);
    }
    listPreferences(request) {
        return this.getPreferencesUseCase.execute((0, read_auth_context_1.readAuthContext)(request));
    }
    setPreference(body, request) {
        return this.setPreferenceUseCase.execute((0, read_auth_context_1.readAuthContext)(request), body.topic, body.enabled);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('device-token'),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_device_token_dto_1.RegisterDeviceTokenDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "registerToken", null);
__decorate([
    (0, common_1.Get)('preferences'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "listPreferences", null);
__decorate([
    (0, common_1.Post)('preferences'),
    (0, roles_decorator_1.Roles)('coach'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_notification_preference_dto_1.SetNotificationPreferenceDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "setPreference", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [get_notification_preferences_usecase_1.GetNotificationPreferencesUseCase,
        register_device_token_usecase_1.RegisterDeviceTokenUseCase,
        set_notification_preference_usecase_1.SetNotificationPreferenceUseCase])
], NotificationsController);
