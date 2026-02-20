"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateExerciseDto = void 0;
const zod_1 = require("zod");
const youtube_url_1 = require("../../domain/youtube-url");
class CreateExerciseDto {
    static schema = zod_1.z
        .object({
        equipment: zod_1.z.string().max(80).nullable().optional(),
        instructions: zod_1.z.string().max(2000).nullable().optional(),
        mediaType: zod_1.z.string().max(40).nullable().optional(),
        mediaUrl: zod_1.z.string().url().max(500).nullable().optional(),
        muscleGroupId: zod_1.z.string().uuid(),
        name: zod_1.z.string().trim().min(1).max(120),
        youtubeUrl: zod_1.z.string().url().max(500).nullable().optional(),
    })
        .superRefine((value, context) => {
        if (value.youtubeUrl && !(0, youtube_url_1.isYouTubeUrl)(value.youtubeUrl)) {
            context.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Youtube URL is invalid',
                path: ['youtubeUrl'],
            });
        }
    });
    equipment;
    instructions;
    mediaType;
    mediaUrl;
    muscleGroupId;
    name;
    youtubeUrl;
}
exports.CreateExerciseDto = CreateExerciseDto;
