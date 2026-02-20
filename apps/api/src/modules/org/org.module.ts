import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ORG_ADMIN_REPOSITORY } from './domain/org-admin.repository.port';
import { OrgAdminRepositoryPrisma } from './infra/prisma/org-admin.repository.prisma';
import { GetOrgOccupancyUseCase } from './application/get-org-occupancy.usecase';
import { UpdateClientLimitUseCase } from './application/update-client-limit.usecase';
import { OrgAdminController } from './presentation/controllers/org-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [OrgAdminController],
  providers: [
    GetOrgOccupancyUseCase,
    UpdateClientLimitUseCase,
    OrgAdminRepositoryPrisma,
    {
      provide: ORG_ADMIN_REPOSITORY,
      useExisting: OrgAdminRepositoryPrisma,
    },
  ],
})
export class OrgModule {}
