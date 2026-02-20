import { z } from 'zod';

export class MeHeadersDto {
  static schema = z
    .object({
      'x-active-role': z.enum(['admin', 'coach', 'client']),
    })
    .passthrough();

  'x-active-role'!: 'admin' | 'coach' | 'client';
}
