import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SessionItem } from '../../../data/hooks/useTodaySession';
import { ActiveExerciseScreen } from '../ActiveExerciseScreen';
import { loggedDraft } from '../active-exercise.save';

type Input = { editable?: boolean; onChangeText: (value: string) => void; value: string };
type Button = { accessibilityLabel?: string; disabled?: boolean; onPress: () => void };
const mockInputs: Input[] = [];
const mockButtons: Button[] = [];
const mockUpdate = jest.fn();
const mockRun = jest.fn().mockResolvedValue(['synced']);

jest.mock('react-native', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  const element = ({ children }: { children?: React.ReactNode }) => react.createElement('div', null, children);
  return {
    KeyboardAvoidingView: element,
    Modal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (visible ? children : null),
    Platform: { OS: 'web' },
    Pressable: (props: Button & { children: React.ReactNode }) => {
      mockButtons.push(props);
      return react.createElement('button', { disabled: props.disabled }, props.children);
    },
    ScrollView: element,
    StyleSheet: { create: (styles: unknown) => styles },
    Text: element,
    TextInput: (props: Input) => {
      mockInputs.push(props);
      return react.createElement('input', { value: props.value, readOnly: true });
    },
    View: element,
  };
});
jest.mock('react-native-svg', () => ({ __esModule: true, default: () => null, Path: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../active-exercise.draft', () => ({
  useActiveSetDraft: (item: SessionItem) => ({
    drafts: Object.fromEntries([1, 2, 3].map((index) => [index, loggedDraft(item, index)])),
    romSet: null,
    saveRom: jest.fn(),
    setCount: 3,
    setRomSet: jest.fn(),
    updateField: mockUpdate,
  }),
}));
jest.mock('../active-exercise.session', () => ({
  useActiveSetSave: () => ({ busy: false, finishing: false, restSeconds: { current: {} }, run: mockRun }),
}));
jest.mock('../../../features/timers/useRestCountdown', () => ({ useRestCountdown: () => null }));
jest.mock('../../../shell/client/feedback', () => ({ showToast: jest.fn() }));
jest.mock('../../../components/YouTubeVideoModal', () => ({ YouTubeVideoModal: () => null }));
jest.mock('../CircularCountdown', () => ({ CircularCountdown: () => null }));
jest.mock('../ExerciseCommentModal', () => ({ ExerciseCommentModal: () => null }));
jest.mock('../PreviousDaysOverlay', () => ({ PreviousDaysOverlay: () => null }));
jest.mock('../RestTimerOverlay', () => ({ RestTimerOverlay: () => null }));
jest.mock('../RomScaleModal', () => ({ RomScaleModal: () => null }));
jest.mock('../WorkoutGuideContext', () => ({ useWorkoutGuide: () => ({ recordSaved: jest.fn() }) }));
jest.mock('../WorkoutGuideCard', () => ({ WorkoutGuideCard: () => null }));

const item = {
  id: 'exercise',
  displayName: 'Sentadilla',
  type: 'strength',
  setsPlanned: 3,
  lockedFields: [],
  plannedSets: [],
  logs: [],
  restSeconds: 60,
  coachInstructions: 'Baja de forma controlada',
} as unknown as SessionItem;

function renderExercise(readOnly = false) {
  return renderToStaticMarkup(
    React.createElement(ActiveExerciseScreen, {
      guideSync: { pendingCount: 0, conflictsCount: 0 },
      guideContext: 'QA workout',
      guideEditable: !readOnly,
      item,
      readOnly,
      exerciseGroup: [item],
      sessionId: 'session',
      visible: true,
      completedRestKeys: [],
      restState: null,
      onAdjustRest: jest.fn(),
      onClose: jest.fn(),
      onCollapseRest: jest.fn(),
      onExpandRest: jest.fn(),
      onFinishExercise: jest.fn(),
      onNavigateExercise: jest.fn(),
      onRestFinish: jest.fn(),
      onLogInterval: jest.fn(),
      onLogIsometricSet: jest.fn(),
      onLogMobilitySet: jest.fn(),
      onLogPlioSet: jest.fn(),
      onLogSet: jest.fn(),
      onLogSport: jest.fn(),
      onStartRest: jest.fn(),
    }),
  );
}

beforeEach(() => {
  mockInputs.length = 0;
  mockButtons.length = 0;
  mockRun.mockClear();
  mockUpdate.mockClear();
});

it('shows every series together with its fields and save action', () => {
  const html = renderExercise();
  for (const index of [1, 2, 3]) expect(html).toContain(`client.today.set ${index}`);
  expect(mockInputs).toHaveLength(12);
  expect(
    mockButtons.filter((button) => button.accessibilityLabel?.startsWith('mobile.client.session.saveSet ')),
  ).toHaveLength(3);
});

it('edits and saves the second series without changing the other series', () => {
  renderExercise();
  expect(mockInputs[4]).toBeDefined();
  mockInputs[4]!.onChangeText('8');
  expect(mockUpdate).toHaveBeenCalledWith(2, 'reps', '8');
  mockButtons.find((button) => button.accessibilityLabel === 'mobile.client.session.saveSet 2')!.onPress();
  expect(mockRun).toHaveBeenCalledWith([2]);
});

it('shows all series of a finished workout without enabling writes', () => {
  renderExercise(true);
  expect(mockInputs).toHaveLength(12);
  expect(mockInputs.every((input) => input.editable === false)).toBe(true);
  expect(mockButtons.some((button) => button.accessibilityLabel?.startsWith('mobile.client.session.saveSet'))).toBe(false);
  expect(mockButtons.some((button) => button.accessibilityLabel === 'mobile.client.session.finishExercise')).toBe(false);
  expect(
    mockButtons
      .filter((button) => button.accessibilityLabel?.startsWith('client.today.restTimer'))
      .every((button) => button.disabled),
  ).toBe(true);
});
