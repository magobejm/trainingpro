import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { createQueryClient } from './data/query-client';

const queryClient = createQueryClient();

function Root(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing root element');
}

createRoot(container).render(<Root />);
