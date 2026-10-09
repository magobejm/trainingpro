import type { TestInputs, TestResult } from './evaluate-test';

export type PhysicalTestView = {
  id: string;
  code: string;
  category: string;
  name: string;
  level: string;
  objective: string;
  whatToDo: string;
  whatToMeasure: string;
  options: {
    economic: string;
    pro: string;
  } | null;
  normTables: unknown | null;
  sortOrder: number;
};

export type PhysicalTestResultView = {
  id: string;
  clientId: string;
  physicalTestId: string;
  inputsJson: TestInputs;
  rawScore: string;
  classification: string;
  classificationColor: string | null;
  measuredAt: string;
};

export type PhysicalTestScheduleSummary = {
  done: boolean;
  id: string;
  resultId: string | null;
  scheduledDate: string;
};

export type ClientPhysicalTestAssignmentView = {
  id: string;
  clientId: string;
  physicalTestId: string;
  assignedAt: string;
  physicalTest: PhysicalTestView;
  latestResult: PhysicalTestResultView | null;
  results: PhysicalTestResultView[];
  schedules: PhysicalTestScheduleSummary[];
};

export type ClientPhysicalTestScheduleView = {
  id: string;
  scheduledDate: string;
  physicalTest: Omit<PhysicalTestView, 'normTables'>;
  result: PhysicalTestResultView | null;
};

export type CoachPhysicalTestScheduleView = {
  id: string;
  physicalTestId: string;
  physicalTestName: string;
  scheduledDate: string;
  done: boolean;
  result: PhysicalTestResultView | null;
};

export type PhysicalTestCalendarRow = {
  clientId: string;
  clientName: string;
  coachMembershipId: string;
  createdAt: Date;
  done: boolean;
  id: string;
  scheduledDate: Date;
  testName: string;
  updatedAt: Date;
};

export type ClientPhysicalTestWithHistoryView = ClientPhysicalTestAssignmentView & {
  results: PhysicalTestResultView[];
};

export type RecordPhysicalTestResultInput = {
  clientId: string;
  physicalTestId: string;
  inputs: TestInputs;
  evaluation: TestResult;
  recordedByMembershipId?: string;
  scheduleId?: string;
};
