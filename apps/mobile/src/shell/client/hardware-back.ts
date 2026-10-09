import type { TabId } from '../../theme/primitives';
import type { OverlayId } from './client-shell.constants';

export type HardwareBackAction = 'close-overlay' | 'exit' | 'go-home';

export function hardwareBackAction(input: { activeTab: TabId; overlay: OverlayId }): HardwareBackAction {
  if (input.overlay) {
    return 'close-overlay';
  }
  if (input.activeTab !== 'home') {
    return 'go-home';
  }
  return 'exit';
}
