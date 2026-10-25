import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../auth/presentation/http-auth-request';
import { CopilotService } from './copilot.service';

class RoutineDraftDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    daysPerWeek: z.number().int().min(1).max(7),
    goal: z.string().trim().min(1).max(160),
    sessionMinutes: z.number().int().min(15).max(180),
  });
  clientId!: string;
  daysPerWeek!: number;
  goal!: string;
  sessionMinutes!: number;
}

class NutritionDraftDto {
  static schema = z.object({ clientId: z.string().uuid() });
  clientId!: string;
}

class WeeklySummaryDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    weekStart: z.string().date(),
  });
  clientId!: string;
  weekStart!: string;
}

@Controller('copilot')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CopilotController {
  constructor(private readonly copilot: CopilotService) {}

  @Post('routine-draft')
  routineDraft(@Body() body: RoutineDraftDto, @Req() request: HttpAuthRequest) {
    return this.copilot.routineDraft(readAuthContext(request), body);
  }

  @Post('nutrition-draft')
  nutritionDraft(@Body() body: NutritionDraftDto, @Req() request: HttpAuthRequest) {
    return this.copilot.nutritionDraft(readAuthContext(request), body);
  }

  @Post('weekly-summary')
  weeklySummary(@Body() body: WeeklySummaryDto, @Req() request: HttpAuthRequest) {
    return this.copilot.weeklySummary(readAuthContext(request), body);
  }
}
