import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import type { TabId } from '../../theme/primitives';
import type { OverlayId } from './client-shell.constants';
import { hardwareBackAction } from './hardware-back';

export function useHardwareBack(input: {
  activeTab: TabId;
  closeOverlay: () => void;
  overlay: OverlayId;
  setActiveTab: (tab: TabId) => void;
}): void {
  const { activeTab, closeOverlay, overlay, setActiveTab } = input;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const action = hardwareBackAction({ activeTab, overlay });
      if (action === 'close-overlay') {
        closeOverlay();
        return true;
      }
      if (action === 'go-home') {
        setActiveTab('home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [activeTab, closeOverlay, overlay, setActiveTab]);
}
