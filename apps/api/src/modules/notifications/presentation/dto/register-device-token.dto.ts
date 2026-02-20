import { z } from 'zod';

export class RegisterDeviceTokenDto {
  static schema = z.object({
    platform: z.string().min(2).max(30),
    token: z.string().min(10).max(255),
  });

  platform!: string;
  token!: string;
}
