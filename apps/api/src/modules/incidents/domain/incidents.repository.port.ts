import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { IncidentListQuery, CreateIncidentInput } from './incident.input';
import type { IncidentActionView, IncidentView } from './incident.entity';

export const INCIDENTS_REPOSITORY = Symbol('INCIDENTS_REPOSITORY');

export interface IncidentsRepositoryPort {
  addAdjustmentDraft(context: AuthContext, incidentId: string, draft: string): Promise<IncidentView>;
  addCoachResponse(context: AuthContext, incidentId: string, response: string): Promise<IncidentView>;
  addTag(context: AuthContext, incidentId: string, tag: string): Promise<IncidentView>;
  archiveIncident(context: AuthContext, incidentId: string): Promise<void>;
  createIncident(context: AuthContext, input: CreateIncidentInput): Promise<IncidentView>;
  getIncident(context: AuthContext, incidentId: string): Promise<IncidentView>;
  listActions(context: AuthContext, incidentId: string): Promise<IncidentActionView[]>;
  listIncidents(context: AuthContext, query: IncidentListQuery): Promise<IncidentView[]>;
  markReviewed(context: AuthContext, incidentId: string): Promise<IncidentView>;
}
