import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkoutGuideCard } from '../WorkoutGuideCard';
import { initialWorkoutGuide } from '@trainerpro/shared';

const mockGuide = {
  guide: { ...initialWorkoutGuide, eligibleForAutoStart: true },
  hydrated: true,
  paused: false,
  error: false,
  advance: jest.fn(),
  complete: jest.fn(),
  dismiss: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
};
const mockButtons: { children: React.ReactElement<{ children: string }>; onPress: () => void }[] = [];
jest.mock('../WorkoutGuideContext', () => ({ useWorkoutGuide: () => mockGuide }));
jest.mock('../WorkoutGuideChat', () => ({ WorkoutGuideChat: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  const element = ({ children }: { children?: React.ReactNode }) => react.createElement('div', null, children);
  return {
    View: element,
    Text: element,
    StyleSheet: { create: (s: unknown) => s },
    Pressable: (props: { children: React.ReactElement<{ children: string }>; onPress: () => void }) => {
      mockButtons.push(props);
      return react.createElement('button', null, props.children);
    },
  };
});
const props = { editable: true, location: 'exercise' as const, context: 'QA', pendingCount: 0, conflictsCount: 0 };
beforeEach(() => {
  mockButtons.length = 0;
  mockGuide.guide = { ...initialWorkoutGuide, eligibleForAutoStart: true };
  mockGuide.hydrated = true;
  mockGuide.paused = false;
  jest.clearAllMocks();
});
it('offers the guide without starting or mutating the session on render', () => {
  const html = renderToStaticMarkup(React.createElement(WorkoutGuideCard, props));
  expect(html).toContain('mobile.guide.invite.title');
  expect(mockGuide.advance).not.toHaveBeenCalled();
  mockButtons.find((b) => b.children.props.children === 'mobile.guide.start')!.onPress();
  expect(mockGuide.advance).toHaveBeenCalledWith('record');
});
it('does not offer automatic guidance before hydration or in a read-only session', () => {
  expect(renderToStaticMarkup(React.createElement(WorkoutGuideCard, { ...props, editable: false }))).toBe('');
  mockGuide.hydrated = false;
  expect(renderToStaticMarkup(React.createElement(WorkoutGuideCard, props))).toBe('');
});
it('waits for a real save without a next button on the save step', () => {
  mockGuide.guide = { version: 1, status: 'in_progress', step: 'save', eligibleForAutoStart: true };
  expect(renderToStaticMarkup(React.createElement(WorkoutGuideCard, props))).toContain('mobile.guide.save.title');
  expect(mockButtons.some((b) => b.children.props.children === 'mobile.guide.continue')).toBe(false);
});
it('explains real pending and conflict states without claiming synchronization', () => {
  mockGuide.guide = { version: 1, status: 'in_progress', step: 'sync', eligibleForAutoStart: true };
  const pending = renderToStaticMarkup(React.createElement(WorkoutGuideCard, { ...props, pendingCount: 1 }));
  expect(pending).toContain('mobile.guide.sync.pending');
  expect(pending).not.toContain('mobile.guide.sync.synced');
  const conflict = renderToStaticMarkup(React.createElement(WorkoutGuideCard, { ...props, conflictsCount: 1 }));
  expect(conflict).toContain('mobile.guide.sync.conflict');
});
it('opens comments only after an explicit tap', () => {
  mockGuide.guide = { version: 1, status: 'in_progress', step: 'help', eligibleForAutoStart: true };
  const open = jest.fn();
  renderToStaticMarkup(React.createElement(WorkoutGuideCard, { ...props, onOpenComment: open }));
  expect(open).not.toHaveBeenCalled();
  mockButtons.find((b) => b.children.props.children === 'mobile.guide.comment')!.onPress();
  expect(open).toHaveBeenCalledTimes(1);
});
