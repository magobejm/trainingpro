import { z } from 'zod';

export class DeviceTokenDto {
  static schema = z.object({
    token: z.string().min(10).max(255),
  });

  token!: string;
}
