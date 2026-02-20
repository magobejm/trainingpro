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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const get_me_usecase_1 = require("../application/get-me.usecase");
const auth_guard_1 = require("../../auth/presentation/guards/auth.guard");
const roles_decorator_1 = require("../../auth/presentation/decorators/roles.decorator");
const roles_guard_1 = require("../../auth/presentation/guards/roles.guard");
const me_headers_dto_1 = require("./dto/me-headers.dto");
let UsersController = class UsersController {
    getMeUseCase;
    constructor(getMeUseCase) {
        this.getMeUseCase = getMeUseCase;
    }
    async getMe(headers, request) {
        const user = request.user;
        if (!user) {
            return {
                email: '',
                roles: [],
            };
        }
        const activeRole = headers['x-active-role'];
        const profile = await this.getMeUseCase.execute(user);
        void activeRole;
        return {
            email: profile.email,
            roles: profile.roles,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)('admin', 'coach', 'client'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_headers_dto_1.MeHeadersDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [get_me_usecase_1.GetMeUseCase])
], UsersController);
