import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { ThemeProvider, ToastProvider } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import './i18n';
import { App } from './App';
import { createQueryClient } from './data/query-client';

const queryClient = createQueryClient();

function Root(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider dismissLabel={t('common.close')}>
          <View style={{ flex: 1, height: '100%', minHeight: 0, width: '100%' }}>
            <App />
          </View>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing root element');
}

createRoot(container).render(<Root />);
