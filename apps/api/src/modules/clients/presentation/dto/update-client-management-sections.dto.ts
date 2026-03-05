import { z } from 'zod';
import {
  CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER,
  type ClientManagementSectionCode,
} from '../../domain/client-management-section';

const sectionCodeValues = CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER as [
  ClientManagementSectionCode,
  ...ClientManagementSectionCode[],
];

const sectionSchema = z.object({
  archived: z.boolean(),
  code: z.enum(sectionCodeValues),
  sortOrder: z.number().int().min(0).max(100),
});

export class UpdateClientManagementSectionsDto {
  static schema = z.object({
    items: z.array(sectionSchema).min(1).max(10),
  });

  items!: Array<{
    archived: boolean;
    code: ClientManagementSectionCode;
    sortOrder: number;
  }>;
}
