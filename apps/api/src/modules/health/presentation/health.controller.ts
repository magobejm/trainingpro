import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string; capabilities: { routineHandoffPreview: boolean; routineVersions: boolean } } {
    return { status: 'ok', capabilities: { routineHandoffPreview: true, routineVersions: true } };
  }
}
