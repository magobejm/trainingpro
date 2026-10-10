export const CONTRACTED_ROUTES = [
  { method: 'get', operationId: 'listClients', path: '/clients' },
  { method: 'get', operationId: 'listStrengthPlanTemplates', path: '/plans/templates/strength' },
  { method: 'get', operationId: 'getSession', path: '/sessions/{sessionId}' },
  { method: 'get', operationId: 'listChatMessages', path: '/chat/messages' },
] as const;

export type ContractedRoute = (typeof CONTRACTED_ROUTES)[number];

export function contractedRoute(method: string, path: string): ContractedRoute | undefined {
  return CONTRACTED_ROUTES.find((route) => route.method === method && route.path === path);
}
