import { Inject, Injectable } from '@nestjs/common';
import {
  ORG_ADMIN_REPOSITORY,
  type OrgAdminRepositoryPort,
  type OrganizationOccupancy,
} from '../domain/org-admin.repository.port';

@Injectable()
export class UpdateClientLimitUseCase {
  constructor(
    @Inject(ORG_ADMIN_REPOSITORY)
    private readonly repository: OrgAdminRepositoryPort,
  ) {}

  execute(adminSupabaseUid: string, clientLimit: number): Promise<OrganizationOccupancy> {
    return this.repository.updateClientLimitByAdmin(adminSupabaseUid, clientLimit);
  }
}
