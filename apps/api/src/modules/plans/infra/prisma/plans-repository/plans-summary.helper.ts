import { Prisma, TemplateKind } from '@prisma/client';

export type PlanTemplateRow = Prisma.PlanTemplateGetPayload<Record<string, never>>;

export interface PlanTemplateSummary {
  id: string;
  name: string;
  scope: 'COACH' | 'GLOBAL';
  kind: TemplateKind;
  createdAt: Date;
  updatedAt: Date;
  templateVersion: number;
  days: never[];
}

export function makePlanSummary(r: PlanTemplateRow): PlanTemplateSummary {
  return {
    id: r.id,
    name: r.name,
    scope: r.scope as 'COACH' | 'GLOBAL',
    kind: r.kind,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    templateVersion: r.templateVersion,
    days: [],
  };
}
