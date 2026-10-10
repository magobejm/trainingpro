import type { Request } from 'express';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function isStaticPath(path: string): boolean {
  return path === '/assets' || path.startsWith('/assets/') || path === '/uploads' || path.startsWith('/uploads/');
}

export function routeOf(request: Request): string {
  const pattern = expressPattern(request);
  if (pattern) {
    return pattern;
  }
  return (request.path || '/').replace(UUID, ':id');
}

export function moduleOf(route: string): string {
  const segment = route.split('/').find((part) => part.length > 0 && !part.startsWith(':'));
  return segment ?? 'http';
}

function expressPattern(request: Request): string | null {
  const routePath = request.route?.path;
  if (typeof routePath !== 'string' || routePath.length === 0) {
    return null;
  }
  return joinRoute(request.baseUrl || '', routePath);
}

function joinRoute(base: string, routePath: string): string {
  if (routePath.startsWith('/')) {
    return routePath;
  }
  return `${base}/${routePath}`.replace(/\/{2,}/g, '/');
}
