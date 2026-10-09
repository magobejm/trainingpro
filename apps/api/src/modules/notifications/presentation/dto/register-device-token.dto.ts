import { z } from 'zod';

export class RegisterDeviceTokenDto {
  static schema = z.object({
    enabled: z.boolean().optional(),
    platform: z.string().min(2).max(30),
    token: z.string().min(10).max(255),
  });

  enabled?: boolean;
  platform!: string;
  token!: string;
}
