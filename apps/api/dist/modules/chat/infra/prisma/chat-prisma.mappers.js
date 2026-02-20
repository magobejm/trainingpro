"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapChatThread = mapChatThread;
exports.mapChatMessage = mapChatMessage;
function mapChatThread(row) {
    return {
        clientId: row.clientId,
        coachMembershipId: row.coachMembershipId,
        id: row.id,
        organizationId: row.organizationId,
        updatedAt: row.updatedAt,
    };
}
function mapChatMessage(row) {
    return {
        attachments: row.attachments.map(mapChatAttachment),
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        id: row.id,
        senderRole: row.senderRole,
        senderSubject: row.senderSubject,
        text: row.text,
        threadId: row.threadId,
    };
}
function mapChatAttachment(row) {
    return {
        fileName: row.fileName,
        id: row.id,
        kind: row.kind,
        mimeType: row.mimeType,
        publicUrl: row.publicUrl,
        sizeBytes: row.sizeBytes,
        storagePath: row.storagePath,
    };
}
