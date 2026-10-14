import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import '../i18n';
import { RouteErrorScreen } from './RouteErrorScreen';

async function failedRoute(error: Error): Promise<string> {
  const routes = [
    {
      path: '*',
      element: React.createElement('div', null, 'Calendar'),
      errorElement: React.createElement(RouteErrorScreen),
      loader: () => {
        throw error;
      },
    },
  ];
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request('https://app.example.com/coach/calendar'));
  if (context instanceof Response) throw new Error('Unexpected redirect');
  const router = createStaticRouter(handler.dataRoutes, context);
  return renderToStaticMarkup(React.createElement(StaticRouterProvider, { router, context, hydrate: false }));
}

describe('route recovery', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://app.example.com/assets/Calendar-old.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: https://app.example.com/assets/Calendar-old.js',
  ])('offers a safe reload for unavailable modules: %s', async (message) => {
    const html = await failedRoute(new TypeError(message));
    expect(html).toContain('No hemos podido cargar esta pantalla');
    expect(html).toContain('actualizado');
    expect(html).toContain('Recargar aplicación');
    expect(html).toContain('sin guardar');
    expect(html).not.toContain('Calendar-old.js');
    expect(html).not.toContain('Unexpected Application Error');
  });

  it('handles other unexpected errors without exposing internal details', async () => {
    const html = await failedRoute(new Error('PRIVATE internal stack or customer data'));
    expect(html).toContain('Algo no ha salido bien');
    expect(html).toContain('Recargar aplicación');
    expect(html).not.toContain('PRIVATE');
    expect(html).not.toContain('Hey developer');
  });
});
