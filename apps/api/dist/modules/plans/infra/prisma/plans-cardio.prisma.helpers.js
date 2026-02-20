"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCardioDayCreate = mapCardioDayCreate;
exports.mapCardioTemplate = mapCardioTemplate;
exports.cardioTemplateInclude = cardioTemplateInclude;
function mapCardioDayCreate(day) {
    return {
        cardioBlocks: { create: day.cardioBlocks.map(mapCardioBlockCreate) },
        dayIndex: day.dayIndex,
        title: day.title.trim(),
    };
}
function mapCardioTemplate(row) {
    return {
        createdAt: row.createdAt,
        days: row.days.map(mapCardioDay),
        id: row.id,
        name: row.name,
        templateVersion: row.templateVersion,
        updatedAt: row.updatedAt,
    };
}
function cardioTemplateInclude() {
    return {
        days: {
            include: {
                cardioBlocks: {
                    include: { fieldModes: true },
                    orderBy: { sortOrder: 'asc' },
                    where: { archivedAt: null },
                },
            },
            orderBy: { dayIndex: 'asc' },
            where: { archivedAt: null },
        },
    };
}
function mapCardioBlockCreate(block) {
    return {
        displayName: block.displayName.trim(),
        fieldModes: {
            create: block.fieldModes.map((entry) => ({
                fieldKey: entry.fieldKey.trim(),
                mode: entry.mode,
            })),
        },
        libraryCardioMethod: connectCardioMethod(block.cardioMethodLibraryId),
        notes: normalizeText(block.notes),
        restSeconds: block.restSeconds ?? 0,
        roundsPlanned: block.roundsPlanned ?? 1,
        sortOrder: block.sortOrder,
        targetDistanceMeters: block.targetDistanceMeters ?? null,
        targetRpe: block.targetRpe ?? null,
        workSeconds: block.workSeconds,
    };
}
function mapCardioDay(day) {
    return {
        cardioBlocks: day.cardioBlocks.map(mapCardioBlock),
        dayIndex: day.dayIndex,
        id: day.id,
        title: day.title,
    };
}
function mapCardioBlock(block) {
    return {
        cardioMethodLibraryId: block.cardioMethodLibraryId,
        displayName: block.displayName,
        fieldModes: block.fieldModes.map((entry) => ({
            fieldKey: entry.fieldKey,
            mode: entry.mode,
        })),
        id: block.id,
        notes: block.notes,
        restSeconds: block.restSeconds,
        roundsPlanned: block.roundsPlanned,
        sortOrder: block.sortOrder,
        targetDistanceMeters: block.targetDistanceMeters,
        targetRpe: block.targetRpe,
        workSeconds: block.workSeconds,
    };
}
function connectCardioMethod(cardioMethodLibraryId) {
    if (!cardioMethodLibraryId) {
        return undefined;
    }
    return { connect: { id: cardioMethodLibraryId } };
}
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
