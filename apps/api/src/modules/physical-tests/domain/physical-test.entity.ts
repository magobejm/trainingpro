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

export type ClientPhysicalTestAssignmentView = {
  id: string;
  clientId: string;
  physicalTestId: string;
  assignedAt: string;
  physicalTest: PhysicalTestView;
  latestResult: PhysicalTestResultView | null;
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
};
