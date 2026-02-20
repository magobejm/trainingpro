import { z } from 'zod';
import { isYouTubeUrl } from '../../domain/youtube-url';

export class CreateExerciseDto {
  static schema = z
    .object({
      equipment: z.string().max(80).nullable().optional(),
      instructions: z.string().max(2000).nullable().optional(),
      mediaType: z.string().max(40).nullable().optional(),
      mediaUrl: z.string().url().max(500).nullable().optional(),
      muscleGroupId: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
      youtubeUrl: z.string().url().max(500).nullable().optional(),
    })
    .superRefine((value, context) => {
      if (value.youtubeUrl && !isYouTubeUrl(value.youtubeUrl)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Youtube URL is invalid',
          path: ['youtubeUrl'],
        });
      }
    });

  equipment?: null | string;
  instructions?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  muscleGroupId!: string;
  name!: string;
  youtubeUrl?: null | string;
}
