"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetNotificationPreferenceDto = void 0;
const zod_1 = require("zod");
const topicSchema = zod_1.z.enum([
    'SESSION_COMPLETED',
    'INCIDENT_CRITICAL',
    'CLIENT_INACTIVE_3D',
    'ADHERENCE_LOW_WEEKLY',
    'CLIENT_REMINDER',
]);
class SetNotificationPreferenceDto {
    static schema = zod_1.z.object({
        enabled: zod_1.z.boolean(),
        topic: topicSchema,
    });
    enabled;
    topic;
}
exports.SetNotificationPreferenceDto = SetNotificationPreferenceDto;
