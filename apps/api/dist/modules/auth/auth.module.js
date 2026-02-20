"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_token_service_1 = require("./application/auth-token.service");
const token_verifier_token_1 = require("./domain/token-verifier.token");
const supabase_jwt_verifier_1 = require("./infra/supabase/supabase-jwt-verifier");
const auth_guard_1 = require("./presentation/guards/auth.guard");
const roles_guard_1 = require("./presentation/guards/roles.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        providers: [
            supabase_jwt_verifier_1.SupabaseJwtVerifier,
            {
                provide: token_verifier_token_1.TOKEN_VERIFIER,
                useExisting: supabase_jwt_verifier_1.SupabaseJwtVerifier,
            },
            auth_token_service_1.AuthTokenService,
            auth_guard_1.AuthGuard,
            roles_guard_1.RolesGuard,
        ],
        exports: [auth_guard_1.AuthGuard, roles_guard_1.RolesGuard, auth_token_service_1.AuthTokenService],
    })
], AuthModule);
