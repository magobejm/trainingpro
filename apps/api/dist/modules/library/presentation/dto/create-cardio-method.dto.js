"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCardioMethodDto = void 0;
const zod_1 = require("zod");
const youtube_url_1 = require("../../domain/youtube-url");
class CreateCardioMethodDto {
    static schema = zod_1.z
        .object({
        description: zod_1.z.string().max(2000).nullable().optional(),
        mediaType: zod_1.z.string().max(40).nullable().optional(),
        mediaUrl: zod_1.z.string().url().max(500).nullable().optional(),
        methodTypeId: zod_1.z.string().uuid(),
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
    description;
    mediaType;
    mediaUrl;
    methodTypeId;
    name;
    youtubeUrl;
}
exports.CreateCardioMethodDto = CreateCardioMethodDto;
