import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { ClientCreateInput } from './client-create.input';
import type { ClientManagementSection } from './client-management-section';
import type { ClientObjective } from './client-objective';
import type { ClientUpdateInput } from './client-update.input';
import type { Client } from './client';

export type ClientsRepositoryPort = {
  archiveClient: (context: AuthContext, clientId: string) => Promise<void>;
  canCoachAccessClient: (coachSubject: string, clientId: string) => Promise<boolean>;
  createClient: (context: AuthContext, input: ClientCreateInput) => Promise<Client>;
  getClientById: (context: AuthContext, clientId: string) => Promise<Client | null>;
  getClientManagementSections: (
    context: AuthContext,
    clientId: string,
  ) => Promise<ClientManagementSection[]>;
  listObjectives: () => Promise<ClientObjective[]>;
  listClientsByCoach: (context: AuthContext) => Promise<Client[]>;
  saveClientManagementSections: (
    context: AuthContext,
    clientId: string,
    items: ClientManagementSection[],
  ) => Promise<ClientManagementSection[]>;
  updateClient: (
    context: AuthContext,
    clientId: string,
    input: ClientUpdateInput,
  ) => Promise<Client>;
};

export const CLIENTS_REPOSITORY = Symbol('CLIENTS_REPOSITORY');
