"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrementClientCount = decrementClientCount;
exports.ensureClientCapacity = ensureClientCapacity;
exports.ensureClientMembership = ensureClientMembership;
exports.tryRestoreArchivedClient = tryRestoreArchivedClient;
exports.ensureUniqueClientEmail = ensureUniqueClientEmail;
exports.ensureEmailNotUsedByPrivilegedMembership = ensureEmailNotUsedByPrivilegedMembership;
exports.incrementClientCount = incrementClientCount;
exports.readActiveClient = readActiveClient;
exports.resolveCoachMembership = resolveCoachMembership;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
async function decrementClientCount(tx, organizationId) {
    const subscription = await tx.organizationSubscription.findUnique({
        where: { organizationId },
        select: { activeClientCount: true, id: true },
    });
    if (!subscription) {
        return;
    }
    const activeClientCount = Math.max(0, subscription.activeClientCount - 1);
    await tx.organizationSubscription.update({
        where: { id: subscription.id },
        data: { activeClientCount },
    });
}
async function ensureClientCapacity(tx, organizationId) {
    const subscription = await tx.organizationSubscription.findUnique({
        where: { organizationId },
        select: { activeClientCount: true, clientLimit: true },
    });
    if (!subscription) {
        throw new common_1.ConflictException('Organization subscription not configured');
    }
    if (subscription.activeClientCount >= subscription.clientLimit) {
        throw new common_1.ConflictException('Client limit reached for organization');
    }
}
async function ensureClientMembership(tx, organizationId, input) {
    if (!input.clientSupabaseUid) {
        return;
    }
    const user = await resolveClientUser(tx, input.clientSupabaseUid, input.email);
    await upsertClientMembership(tx, organizationId, user.id);
}
async function tryRestoreArchivedClient(tx, organizationId, clientData, updatedBy) {
    const { objectiveId, ...clientDataWithoutObjective } = clientData;
    const archived = await tx.client.findFirst({
        where: {
            archivedAt: { not: null },
            email: clientData.email,
            organizationId,
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
    if (!archived) {
        return null;
    }
    return tx.client.update({
        where: { id: archived.id },
        data: {
            ...clientDataWithoutObjective,
            archivedAt: null,
            archivedBy: null,
            objectiveRef: { connect: { id: objectiveId } },
            updatedBy,
        },
        include: { objectiveRef: true },
    });
}
async function ensureUniqueClientEmail(tx, organizationId, email) {
    const existing = await tx.client.findFirst({
        where: { archivedAt: null, email, organizationId },
        select: { id: true },
    });
    if (existing) {
        throw new common_1.ConflictException('Client email already exists');
    }
}
async function ensureEmailNotUsedByPrivilegedMembership(tx, organizationId, email) {
    const existing = await tx.organizationMember.findFirst({
        where: {
            archivedAt: null,
            isActive: true,
            organizationId,
            role: { in: [client_1.Role.ADMIN, client_1.Role.COACH] },
            user: { email },
        },
        select: { id: true },
    });
    if (existing) {
        throw new common_1.ConflictException('Email already belongs to an admin or coach');
    }
}
async function incrementClientCount(tx, organizationId) {
    await tx.organizationSubscription.update({
        where: { organizationId },
        data: { activeClientCount: { increment: 1 } },
    });
}
async function readActiveClient(tx, membership, clientId) {
    const client = await tx.client.findFirst({
        where: {
            archivedAt: null,
            coachMembershipId: membership.id,
            id: clientId,
        },
        select: { id: true },
    });
    if (!client) {
        throw new common_1.NotFoundException('Client not found');
    }
    return client;
}
async function resolveCoachMembership(context, tx) {
    const membership = await tx.organizationMember.findFirst({
        where: {
            archivedAt: null,
            isActive: true,
            role: client_1.Role.COACH,
            user: { supabaseUid: context.subject },
        },
        select: { id: true, organizationId: true },
    });
    if (!membership) {
        throw new common_1.ForbiddenException('Coach membership not found');
    }
    return membership;
}
async function resolveClientUser(tx, supabaseUid, email) {
    const bySubject = await readUserBySubject(tx, supabaseUid);
    const byEmail = await readUserByEmail(tx, email);
    if (bySubject && byEmail && bySubject.id !== byEmail.id) {
        return reconcileConflictingUsers(tx, byEmail.id, supabaseUid);
    }
    if (bySubject) {
        return updateSubjectUser(tx, bySubject.id, email);
    }
    if (byEmail) {
        return updateEmailUser(tx, byEmail.id, supabaseUid);
    }
    return createClientUser(tx, email, supabaseUid);
}
async function upsertClientMembership(tx, organizationId, userId) {
    await tx.organizationMember.upsert({
        where: {
            organizationId_userId_role: {
                organizationId,
                role: client_1.Role.CLIENT,
                userId,
            },
        },
        create: { organizationId, role: client_1.Role.CLIENT, userId },
        update: { archivedAt: null, isActive: true },
    });
}
function readUserBySubject(tx, supabaseUid) {
    return tx.user.findUnique({
        where: { supabaseUid },
        select: { id: true },
    });
}
function readUserByEmail(tx, email) {
    return tx.user.findUnique({
        where: { email },
        select: { id: true },
    });
}
function reconcileConflictingUsers(tx, userId, supabaseUid) {
    return tx.user.update({
        where: { id: userId },
        data: { isActive: true, supabaseUid },
        select: { id: true },
    });
}
function updateSubjectUser(tx, userId, email) {
    return tx.user.update({
        where: { id: userId },
        data: { email, isActive: true },
        select: { id: true },
    });
}
function updateEmailUser(tx, userId, supabaseUid) {
    return tx.user.update({
        where: { id: userId },
        data: { isActive: true, supabaseUid },
        select: { id: true },
    });
}
function createClientUser(tx, email, supabaseUid) {
    return tx.user.create({
        data: { email, supabaseUid },
        select: { id: true },
    });
}
