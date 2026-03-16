import { z } from 'zod';
import { isYouTubeUrl } from '../../domain/youtube-url';

export class CreateCardioMethodDto {
  static schema = z
    .object({
      description: z.string().max(2000).nullable().optional(),
      equipment: z.string().max(120).nullable().optional(),
      mediaType: z.string().max(40).nullable().optional(),
      mediaUrl: z.string().url().max(500).nullable().optional(),
      methodTypeId: z.string().uuid().optional(),
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

  description?: null | string;
  equipment?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  methodTypeId?: string;
  name!: string;
  youtubeUrl?: null | string;
}
