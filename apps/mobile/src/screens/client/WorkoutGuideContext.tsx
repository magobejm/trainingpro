import React, { createContext, useContext } from 'react';
import { useWorkoutGuideController } from '../../data/hooks/useWorkoutGuide';

const Context = createContext<ReturnType<typeof useWorkoutGuideController> | null>(null);

export function WorkoutGuideProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const controller = useWorkoutGuideController();
  return <Context.Provider value={controller}>{children}</Context.Provider>;
}

export function useWorkoutGuide() {
  const controller = useContext(Context);
  if (!controller) throw new Error('WorkoutGuideProvider is required');
  return controller;
}
