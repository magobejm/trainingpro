export const NOTES_REPOSITORY = Symbol('NOTES_REPOSITORY');

export type CreateNoteInput = {
  type: 'client' | 'general';
  clientId?: string;
  content: string;
};

export type UpdateNoteInput = {
  content: string;
};

export type ListNotesQuery = {
  type?: 'client' | 'general';
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type CoachNoteEntity = {
  id: string;
  coachMembershipId: string;
  type: 'client' | 'general';
  clientId: string | null;
  clientName?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface INotesRepository {
  create(coachMembershipId: string, input: CreateNoteInput): Promise<CoachNoteEntity>;
  findById(id: string, coachMembershipId: string): Promise<CoachNoteEntity | null>;
  list(coachMembershipId: string, query: ListNotesQuery): Promise<CoachNoteEntity[]>;
  update(id: string, coachMembershipId: string, input: UpdateNoteInput): Promise<CoachNoteEntity>;
  delete(id: string, coachMembershipId: string): Promise<void>;
}
