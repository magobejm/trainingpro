type ClientSeed = {
  coach: string;
  id: string;
};

const DEFAULT_OBJECTIVE_ID = '00000000-0000-0000-0000-000000000000';
const STATIC_CLIENT_FIELDS = {
  allergies: null,
  birthDate: null,
  considerations: null,
  fcMax: null,
  fcRest: null,
  firstName: 'Fake',
  fitnessLevel: null,
  heightCm: null,
  hipCm: null,
  injuries: null,
  lastName: 'Client',
  notes: null,
  objective: null,
  objectiveId: DEFAULT_OBJECTIVE_ID,
  organizationId: 'org-1',
  phone: null,
  progressPhotos: [],
  secondaryObjectives: [],
  sex: null,
  trainingPlanId: null,
  waistCm: null,
  weightKg: null,
};

export function mapClientFromSeed(row: ClientSeed | null) {
  if (!row) return null;
  const now = new Date();
  return {
    ...STATIC_CLIENT_FIELDS,
    coachMembershipId: `membership-${row.coach}`,
    createdAt: now,
    email: `${row.id}@fitcoach.local`,
    id: row.id,
    updatedAt: now,
  };
}
