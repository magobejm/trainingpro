import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ORG_ADMIN_REPOSITORY } from './domain/org-admin.repository.port';
import { OrgAdminRepositoryPrisma } from './infra/prisma/org-admin.repository.prisma';
import { GetOrgOccupancyUseCase } from './application/get-org-occupancy.usecase';
import { UpdateClientLimitUseCase } from './application/update-client-limit.usecase';
import { OrgMetricsService } from './application/org-metrics.service';
import { OrgAdminController } from './presentation/controllers/org-admin.controller';
import { OrgMetricsController } from './presentation/controllers/org-metrics.controller';

@Module({
  imports: [AuthModule],
  controllers: [OrgAdminController, OrgMetricsController],
  providers: [
    GetOrgOccupancyUseCase,
    OrgMetricsService,
    UpdateClientLimitUseCase,
    OrgAdminRepositoryPrisma,
    {
      provide: ORG_ADMIN_REPOSITORY,
      useExisting: OrgAdminRepositoryPrisma,
    },
  ],
})
export class OrgModule {}
