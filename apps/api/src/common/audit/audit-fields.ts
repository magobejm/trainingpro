import type { AuthContext } from '../auth-context/auth-context';

export type CreateAuditFields = {
  createdBy: string;
  updatedBy: string;
};

export type UpdateAuditFields = {
  updatedBy: string;
};

export type ArchiveAuditFields = {
  archivedAt: Date;
  archivedBy: string;
  updatedBy: string;
};

export function buildCreateAuditFields(context: AuthContext): CreateAuditFields {
  return {
    createdBy: context.subject,
    updatedBy: context.subject,
  };
}

export function buildUpdateAuditFields(context: AuthContext): UpdateAuditFields {
  return {
    updatedBy: context.subject,
  };
}

export function buildArchiveAuditFields(context: AuthContext): ArchiveAuditFields {
  return {
    archivedAt: new Date(),
    archivedBy: context.subject,
    updatedBy: context.subject,
  };
}
