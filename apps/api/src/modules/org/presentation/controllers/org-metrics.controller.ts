import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { OrgMetricsService } from '../../application/org-metrics.service';

const tierSchema = z.object({
  fromClients: z.number().int().min(0),
  monthlyPrice: z.number().min(0),
  toClients: z.number().int().min(0).nullable(),
});

class ReplaceTiersDto {
  static schema = z.object({ tiers: z.array(tierSchema).max(12) });
}

@Controller('org')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class OrgMetricsController {
  constructor(private readonly metrics: OrgMetricsService) {}

  @Get('coaches/metrics')
  coaches(@Req() request: HttpAuthRequest) {
    return this.metrics.coachMetrics(request.user?.subject ?? '');
  }

  @Get('subscription/billing-estimate')
  billing(@Req() request: HttpAuthRequest) {
    return this.metrics.billingEstimate(request.user?.subject ?? '');
  }

  @Put('subscription/pricing-tiers')
  replaceTiers(@Body() body: ReplaceTiersDto, @Req() request: HttpAuthRequest) {
    const parsed = ReplaceTiersDto.schema.parse(body);
    return this.metrics.replaceTiers(request.user?.subject ?? '', parsed.tiers);
  }
}
