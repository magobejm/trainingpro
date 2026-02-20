"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseJwtVerifier = void 0;
const common_1 = require("@nestjs/common");
function getSupabaseUrl() {
    const value = process.env.SUPABASE_URL;
    if (!value) {
        throw new Error('Missing required env var: SUPABASE_URL');
    }
    return value;
}
let SupabaseJwtVerifier = class SupabaseJwtVerifier {
    jwks = null;
    constructor() { }
    async verify(token) {
        try {
            const jose = await Promise.resolve().then(() => __importStar(require('jose')));
            const jwks = (await this.resolveJwks(jose.createRemoteJWKSet));
            const { payload } = await jose.jwtVerify(token, jwks);
            return this.mapPayload(payload);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async resolveJwks(createRemoteJWKSet) {
        if (this.jwks) {
            return this.jwks;
        }
        const supabaseUrl = getSupabaseUrl();
        const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
        this.jwks = createRemoteJWKSet(jwksUrl);
        return this.jwks;
    }
    mapPayload(payload) {
        if (!payload.sub) {
            throw new common_1.UnauthorizedException('Token without subject');
        }
        return {
            email: this.readEmail(payload),
            roles: this.readRoles(payload),
            subject: payload.sub,
        };
    }
    readEmail(payload) {
        const email = payload.email;
        return typeof email === 'string' ? email : undefined;
    }
    readRoles(payload) {
        const roles = new Set();
        const rootRole = payload.role;
        if (typeof rootRole === 'string' && rootRole.length > 0) {
            roles.add(rootRole.toLowerCase());
        }
        this.addFromClaim(roles, payload.app_metadata);
        this.addFromClaim(roles, payload.user_metadata);
        return [...roles];
    }
    addFromClaim(roles, claim) {
        if (!claim || typeof claim !== 'object') {
            return;
        }
        const metadata = claim;
        if (!Array.isArray(metadata.roles)) {
            return;
        }
        for (const role of metadata.roles) {
            if (typeof role === 'string' && role.length > 0) {
                roles.add(role.toLowerCase());
            }
        }
    }
};
exports.SupabaseJwtVerifier = SupabaseJwtVerifier;
exports.SupabaseJwtVerifier = SupabaseJwtVerifier = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SupabaseJwtVerifier);
