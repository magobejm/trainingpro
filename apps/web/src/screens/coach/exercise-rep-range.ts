import type { BlockType } from './RoutinePlanner.types';

export function blockTypeShowsRepRange(type: BlockType | string): boolean {
  return type === 'strength' || type === 'plio' || type === 'mobility' || type === 'sport';
}

export function blockTypeShowsTotalTime(type: BlockType | string): boolean {
  return type === 'cardio';
}
