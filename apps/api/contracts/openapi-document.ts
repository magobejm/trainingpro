import {
  chatMessageListSchema,
  clientListResponseSchema,
  httpErrorSchema,
  sessionViewSchema,
  strengthPlanListResponseSchema,
} from '@trainerpro/shared';
import { z } from 'zod';
import { contractedRoute } from './contracted-routes';
import { chatMessagesExample, clientListExample, sessionExample, strengthPlanListExample } from './examples';
import { toJsonSchema, type JsonSchema } from './json-schema';
import type { RouteRecord } from './route-scan';

const sessionIdSchema = z.string().uuid();
const threadIdSchema = z.string().uuid();

export function buildOpenApiDocument(routes: RouteRecord[]) {
  return {
    components: {
      schemas: {
        ChatMessageList: toJsonSchema(chatMessageListSchema),
        ClientListResponse: toJsonSchema(clientListResponseSchema),
        HttpError: toJsonSchema(httpErrorSchema),
        SessionView: toJsonSchema(sessionViewSchema),
        StrengthPlanListResponse: toJsonSchema(strengthPlanListResponseSchema),
      },
      securitySchemes: {
        activeRole: { in: 'header', name: 'X-Active-Role', type: 'apiKey' },
        bearer: { bearerFormat: 'JWT', scheme: 'bearer', type: 'http' },
      },
    },
    info: {
      description: 'Inventario de rutas y contratos de clientes, planes, sesiones y chat.',
      title: 'TrainerPro API',
      version: '0.0.1',
    },
    openapi: '3.1.0',
    paths: buildPaths(routes),
  };
}

function buildPaths(routes: RouteRecord[]): Record<string, Record<string, JsonSchema>> {
  const paths: Record<string, Record<string, JsonSchema>> = {};
  for (const route of routes) {
    const item = paths[route.path] ?? {};
    item[route.method] = applyContract(baseOperation(route), route);
    paths[route.path] = item;
  }
  return paths;
}

function baseOperation(route: RouteRecord): JsonSchema {
  const operation: JsonSchema = {
    operationId: operationId(route.method, route.path),
    parameters: parametersOf(route),
    responses: responsesOf(route),
    summary: `${route.method.toUpperCase()} ${route.path}`,
    'x-controller': route.controller,
    'x-filters': route.filters,
    'x-guards': route.guards,
    'x-pagination': route.pagination,
    'x-roles': route.roles,
  };
  if (route.auth) {
    operation.security = [{ activeRole: [], bearer: [] }];
  }
  const body = requestBody(route);
  if (body) {
    operation.requestBody = body;
  }
  return operation;
}

function parametersOf(route: RouteRecord): JsonSchema[] {
  const pathParams = [...route.path.matchAll(/\{([^}]+)\}/g)].map((match) =>
    parameter('path', match[1] ?? 'id', true, { type: 'string' }),
  );
  const queryParams = [...route.filters, ...route.pagination].map((name) =>
    parameter('query', name, false, { type: 'string' }, route.pagination.includes(name) ? 'Paginación' : 'Filtro'),
  );
  const headers = route.headers.map((name) => parameter('header', name, false, { type: 'string' }));
  const cron = route.cron ? [parameter('header', 'X-CRON-SECRET', true, { type: 'string' })] : [];
  return [...pathParams, ...queryParams, ...headers, ...cron];
}

function parameter(location: string, name: string, required: boolean, schema: JsonSchema, description?: string): JsonSchema {
  return { ...(description ? { description } : {}), in: location, name, required, schema };
}

function requestBody(route: RouteRecord): JsonSchema | null {
  if (!route.bodyDto && !route.multipart) {
    return null;
  }
  const media = route.multipart ? 'multipart/form-data' : 'application/json';
  return {
    content: { [media]: { schema: { type: 'object' } } },
    description: route.bodyDto ?? 'Archivo',
    required: true,
  };
}

function responsesOf(route: RouteRecord): JsonSchema {
  const responses: JsonSchema = { '200': { description: 'Respuesta correcta' } };
  if (route.auth || route.cron) {
    responses['401'] = errorResponse('No autenticado');
    responses['403'] = errorResponse('Rol o permiso no permitido');
  }
  return responses;
}

function errorResponse(description: string): JsonSchema {
  return {
    content: { 'application/json': { schema: { $ref: '#/components/schemas/HttpError' } } },
    description,
  };
}

function operationId(method: string, path: string): string {
  const slug = path
    .replace(/^\//, '')
    .replace(/[{}]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${method}_${slug || 'root'}`;
}

function applyContract(operation: JsonSchema, route: RouteRecord): JsonSchema {
  const contract = contractedRoute(route.method, route.path);
  if (!contract) {
    return operation;
  }
  const detail = contractDetail(contract.operationId);
  const responses: JsonSchema = { ...(operation.responses as JsonSchema), '200': successResponse(detail) };
  if (detail.badRequest) {
    responses['400'] = errorResponse('Ruta o consulta no válidas');
  }
  return {
    ...operation,
    description: detail.description,
    operationId: contract.operationId,
    parameters: detail.parameters,
    responses,
  };
}

function successResponse(detail: ContractDetail): JsonSchema {
  return {
    content: {
      'application/json': {
        example: detail.example,
        schema: { $ref: `#/components/schemas/${detail.schema}` },
      },
    },
    description: detail.description,
  };
}

type ContractDetail = {
  badRequest: boolean;
  description: string;
  example: unknown;
  parameters: JsonSchema[];
  schema: string;
};

function contractDetail(operationId: string): ContractDetail {
  if (operationId === 'listClients') {
    return clientsDetail();
  }
  if (operationId === 'listStrengthPlanTemplates') {
    return plansDetail();
  }
  if (operationId === 'getSession') {
    return sessionDetail();
  }
  return chatDetail();
}

function clientsDetail(): ContractDetail {
  return {
    badRequest: false,
    description: 'Lista los clientes del entrenador. No pagina.',
    example: clientListExample,
    parameters: [],
    schema: 'ClientListResponse',
  };
}

function plansDetail(): ContractDetail {
  return {
    badRequest: false,
    description: 'Lista las plantillas de fuerza. summary=true devuelve días vacíos y kind, sin coachMembershipId.',
    example: strengthPlanListExample,
    parameters: [summaryParameter()],
    schema: 'StrengthPlanListResponse',
  };
}

function summaryParameter(): JsonSchema {
  return parameter('query', 'summary', false, { enum: ['false', 'true'], type: 'string' }, 'Filtro de resumen');
}

function sessionDetail(): ContractDetail {
  return {
    badRequest: true,
    description: 'Devuelve la sesión del entrenador o del cliente.',
    example: sessionExample,
    parameters: [parameter('path', 'sessionId', true, toJsonSchema(sessionIdSchema), 'Identificador de la sesión')],
    schema: 'SessionView',
  };
}

function chatDetail(): ContractDetail {
  return {
    badRequest: true,
    description: 'Lista los mensajes de un hilo. Filtra por threadId y no pagina.',
    example: chatMessagesExample,
    parameters: [parameter('query', 'threadId', true, toJsonSchema(threadIdSchema), 'Filtro del hilo')],
    schema: 'ChatMessageList',
  };
}
