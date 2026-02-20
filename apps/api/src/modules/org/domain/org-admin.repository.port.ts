export type OrganizationOccupancy = {
  activeClientCount: number;
  clientLimit: number;
  organizationId: string;
};

export type OrgAdminRepositoryPort = {
  getOccupancyByAdmin: (adminSupabaseUid: string) => Promise<OrganizationOccupancy>;
  updateClientLimitByAdmin: (
    adminSupabaseUid: string,
    clientLimit: number,
  ) => Promise<OrganizationOccupancy>;
};

export const ORG_ADMIN_REPOSITORY = Symbol('ORG_ADMIN_REPOSITORY');
