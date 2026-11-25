import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { applyRecoveryUrl } from '../store/password-recovery.store';
import { isNativeRecoveryUrl } from './password-reset-redirect';

export function useRecoveryLinks(): void {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return listenToWebHash();
    }
    return listenToNativeLinks();
  }, []);
}

type BrowserScope = {
  addEventListener?: (type: string, listener: () => void) => void;
  location?: { href?: string };
  removeEventListener?: (type: string, listener: () => void) => void;
};

function listenToWebHash(): () => void {
  const browser = globalThis as BrowserScope;
  const onHash = (): void => applyRecoveryUrl(browser.location?.href ?? null);
  browser.addEventListener?.('hashchange', onHash);
  applyRecoveryUrl(browser.location?.href ?? null);
  return () => browser.removeEventListener?.('hashchange', onHash);
}

function listenToNativeLinks(): () => void {
  let active = true;
  void Linking.getInitialURL().then((url) => {
    if (active) {
      if (isNativeRecoveryUrl(url)) applyRecoveryUrl(url);
    }
  });
  const subscription = Linking.addEventListener('url', (event) => {
    if (isNativeRecoveryUrl(event.url)) applyRecoveryUrl(event.url);
  });
  return () => {
    active = false;
    subscription.remove();
  };
}
