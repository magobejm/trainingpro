"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCardioMethodWhere = buildCardioMethodWhere;
exports.buildExerciseWhere = buildExerciseWhere;
exports.buildFoodWhere = buildFoodWhere;
exports.toDomainScope = toDomainScope;
exports.assertCatalogExists = assertCatalogExists;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function buildCardioMethodWhere(coachMembershipId, filter) {
    return {
        ...buildLibraryScopeWhere(coachMembershipId),
        methodTypeId: equalsFilter(filter.methodTypeId),
        name: containsFilter(filter.query),
    };
}
function buildExerciseWhere(coachMembershipId, filter) {
    return {
        ...buildLibraryScopeWhere(coachMembershipId),
        muscleGroupId: equalsFilter(filter.muscleGroupId),
        name: containsFilter(filter.query),
    };
}
function buildFoodWhere(coachMembershipId, filter) {
    return {
        ...buildLibraryScopeWhere(coachMembershipId),
        foodCategory: containsFilter(filter.foodCategory),
        foodType: containsFilter(filter.foodType),
        name: containsFilter(filter.query),
        servingUnit: equalsFilter(filter.servingUnit),
    };
}
function toDomainScope(scope) {
    return scope === client_1.LibraryItemScope.COACH ? 'coach' : 'global';
}
async function assertCatalogExists(read, message) {
    const row = await read();
    if (!row) {
        throw new common_1.NotFoundException(message);
    }
}
function buildLibraryScopeWhere(coachMembershipId) {
    return {
        OR: [
            { scope: client_1.LibraryItemScope.GLOBAL },
            { coachMembershipId, scope: client_1.LibraryItemScope.COACH },
        ],
        archivedAt: null,
    };
}
function containsFilter(value) {
    if (!value?.trim()) {
        return undefined;
    }
    return { contains: value.trim(), mode: client_1.Prisma.QueryMode.insensitive };
}
function equalsFilter(value) {
    if (!value?.trim()) {
        return undefined;
    }
    return value.trim();
}
