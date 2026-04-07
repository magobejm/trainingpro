export type NoteType = 'client' | 'general';

export type NoteData = {
  id: string;
  type: NoteType;
  clientId: string | null;
  clientName?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientData = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  objectiveId: string;
  objectiveName?: string;
};

export type NotesScreenMode = 'notes';
