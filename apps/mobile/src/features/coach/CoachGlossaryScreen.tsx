import React from 'react';
import { useCoachCopy } from '../../screens/coach/coach-copy';
import { GlossaryList } from '../../screens/glossary/GlossaryList';
import { CoachPage } from './CoachUi';

export function CoachGlossaryScreen(): React.JSX.Element {
  const c = useCoachCopy();
  return (
    <CoachPage title={c('glossary')}>
      <GlossaryList />
    </CoachPage>
  );
}
