import { Alert, Platform, ToastAndroid } from 'react-native';

export function showComingSoon(label: string): void {
  const message = `${label} — próximamente`;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Próximamente', message);
  }
}

export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  if (Platform.OS === 'web') {
    showWebToast(message);
    return;
  }
  Alert.alert('', message);
}

export function showError(message: string, title = 'Error'): void {
  Alert.alert(title, message);
}

const WEB_TOAST_ID = 'trainerpro-web-toast';
const WEB_TOAST_MS = 2800;

type WebNode = {
  id: string;
  remove: () => void;
  setAttribute: (name: string, value: string) => void;
  style: Record<string, string>;
  textContent: string;
};

type WebDocument = {
  body: { appendChild: (node: WebNode) => void };
  createElement: (tag: string) => WebNode;
  getElementById: (id: string) => null | WebNode;
};

function showWebToast(message: string): void {
  const root = globalThis as { document?: WebDocument };
  const doc = root.document;
  if (!doc) return;
  doc.getElementById(WEB_TOAST_ID)?.remove();
  const node = doc.createElement('div');
  node.id = WEB_TOAST_ID;
  node.setAttribute('role', 'status');
  node.textContent = message;
  Object.assign(node.style, {
    background: '#1e3a8a',
    borderRadius: '12px',
    bottom: '24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    left: '50%',
    maxWidth: '90vw',
    padding: '12px 16px',
    position: 'fixed',
    textAlign: 'center',
    transform: 'translateX(-50%)',
    zIndex: '10000',
  });
  doc.body.appendChild(node);
  setTimeout(() => node.remove(), WEB_TOAST_MS);
}
