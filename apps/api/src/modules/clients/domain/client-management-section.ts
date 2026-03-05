export type ClientManagementSectionCode =
  | 'training'
  | 'nutrition'
  | 'mood'
  | 'volume'
  | 'progress'
  | 'anthropometrics'
  | 'planning'
  | 'external'
  | 'incidents'
  | 'chat';

export type ClientManagementSection = {
  archived: boolean;
  code: ClientManagementSectionCode;
  sortOrder: number;
};

export const CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER: ClientManagementSectionCode[] = [
  'training',
  'nutrition',
  'mood',
  'volume',
  'progress',
  'anthropometrics',
  'planning',
  'external',
  'incidents',
  'chat',
];

export function isClientManagementSectionCode(value: string): value is ClientManagementSectionCode {
  return CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER.includes(value as ClientManagementSectionCode);
}

export function buildDefaultClientManagementSections(): ClientManagementSection[] {
  return CLIENT_MANAGEMENT_SECTION_DEFAULT_ORDER.map((code, index) => ({
    archived: false,
    code,
    sortOrder: index,
  }));
}
