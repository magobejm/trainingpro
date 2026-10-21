import {
  workoutGuidePatchSchema,
  workoutGuideResponseSchema,
  clearFutureWorkoutsSchema,
  workoutAdherenceSchema,
  routineHandoffPreviewSchema,
  clientViewSchema,
  routineAssignmentListSchema,
  routineAssignmentDetailSchema,
  routineDayColorSchema,
  routineDayColorsSchema,
  updateRoutineDayColorSchema,
} from '@trainerpro/shared';
import { UpdateClientDto } from '../src/modules/clients/presentation/dto/update-client.dto';
import { routineHandoffExample } from './examples';
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
        WorkoutAdherence: toJsonSchema(workoutAdherenceSchema),
        RoutineHandoffPreview: toJsonSchema(routineHandoffPreviewSchema),
        RoutineAssignmentList: toJsonSchema(routineAssignmentListSchema),
        RoutineAssignmentDetail: toJsonSchema(routineAssignmentDetailSchema),
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

function adherenceOperation(operation: JsonSchema): JsonSchema {
  return {
    ...operation,
    responses: {
      ...(operation.responses as JsonSchema),
      '200': {
        description: 'Completed / scheduled workouts through the last closed day; null without registered agenda.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkoutAdherence' } } },
      },
      '400': errorResponse('Rango no válido'),
      '403': errorResponse('Cliente no accesible'),
    },
  };
}

function workoutGuideOperation(operation: JsonSchema, route: RouteRecord): JsonSchema {
  return {
    ...operation,
    ...(route.method === 'patch'
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: toJsonSchema(workoutGuidePatchSchema) } },
          },
        }
      : {}),
    responses: {
      ...(operation.responses as JsonSchema),
      '200': {
        description: 'Account-scoped, monotonic first workout guide progress',
        content: { 'application/json': { schema: toJsonSchema(workoutGuideResponseSchema) } },
      },
      '400': errorResponse('Invalid guide progress'),
      '403': errorResponse('Client role required'),
      '404': errorResponse('Client profile not found'),
    },
  };
}

function applyContract(operation: JsonSchema, route: RouteRecord): JsonSchema {
  if (route.path === '/clients/me/first-workout-guide') return workoutGuideOperation(operation, route);
  if (route.method === 'get' && route.path === '/progress/adherence') return adherenceOperation(operation);
  if (route.path.startsWith('/clients/{clientId}/routine-day-colors')) {
    const patch = route.method === 'patch';
    return {
      ...operation,
      ...(patch
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: toJsonSchema(updateRoutineDayColorSchema) } },
            },
          }
        : {}),
      responses: {
        ...(operation.responses as JsonSchema),
        '200': {
          description: 'Saved calendar colors for the client routine days; existing events are unchanged.',
          content: { 'application/json': { schema: toJsonSchema(patch ? routineDayColorSchema : routineDayColorsSchema) } },
        },
        '400': errorResponse('Color o día de rutina no válido'),
        '403': errorResponse('Cliente no accesible'),
      },
    };
  }
  if (route.method === 'get' && route.path.includes('/routine-assignments')) {
    const schema = route.path.endsWith('/current')
      ? toJsonSchema(z.record(z.string(), z.unknown()).nullable())
      : {
          $ref: `#/components/schemas/${route.path.endsWith('/{assignmentId}') ? 'RoutineAssignmentDetail' : 'RoutineAssignmentList'}`,
        };
    return {
      ...operation,
      responses: {
        ...(operation.responses as JsonSchema),
        '200': { description: 'Immutable routine assignments', content: { 'application/json': { schema } } },
        '404': errorResponse('Asignación no encontrada'),
      },
    };
  }
  if (route.method === 'get' && route.path === '/health')
    return {
      ...operation,
      responses: {
        '200': {
          description: 'Service health and supported capabilities',
          content: {
            'application/json': {
              schema: toJsonSchema(
                z.object({
                  status: z.string(),
                  capabilities: z.object({ routineHandoffPreview: z.boolean(), routineVersions: z.boolean() }),
                }),
              ),
            },
          },
        },
      },
    };
  if (route.method === 'post' && route.path === '/calendar/clear-future-workouts') return handoffOperation(operation);
  if (route.method === 'patch' && route.path === '/clients/{clientId}') return handoffClientOperation(operation);
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
    parameters:
      route.path === '/sessions/{sessionId}'
        ? [
            ...detail.parameters,
            parameter(
              'query',
              'includeOutcome',
              false,
              { type: 'boolean' },
              'Opt in to outcome, originDate and skip metadata; omitted for legacy strict APK parsers by default.',
            ),
          ]
        : detail.parameters,
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
    description: 'Lista los clientes del entrenador. Sin limit devuelve la lista completa; con limit añade nextCursor.',
    example: clientListExample,
    parameters: [
      parameter('query', 'search', false, { type: 'string' }, 'Búsqueda por nombre'),
      parameter('query', 'objective', false, { type: 'string' }, 'Filtro de objetivo'),
      parameter('query', 'sort', false, { enum: ['activity', 'name'], type: 'string' }, 'Orden'),
      parameter('query', 'limit', false, { type: 'integer' }, 'Paginación'),
      parameter('query', 'cursor', false, { type: 'string' }, 'Paginación'),
    ],
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
    description: 'Lista los 50 mensajes más recientes de un hilo, en orden ascendente. before pide la página anterior.',
    example: chatMessagesExample,
    parameters: [
      parameter('query', 'threadId', true, toJsonSchema(threadIdSchema), 'Filtro del hilo'),
      parameter(
        'query',
        'before',
        false,
        { format: 'date-time', type: 'string' },
        'Cursor: mensajes anteriores a esta fecha',
      ),
    ],
    schema: 'ChatMessageList',
  };
}

function handoffOperation(operation: JsonSchema): JsonSchema {
  return {
    ...operation,
    description:
      'dryRun=true returns the full future workout impact without writes. Otherwise archives only unprotected workouts.',
    requestBody: { required: true, content: { 'application/json': { schema: toJsonSchema(clearFutureWorkoutsSchema) } } },
    responses: {
      ...(operation.responses as JsonSchema),
      '200': {
        description: 'Simulation or archive result',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                toJsonSchema(z.object({ archived: z.number().int() })),
                { $ref: '#/components/schemas/RoutineHandoffPreview' },
              ],
            },
            examples: { preview: { value: routineHandoffExample }, legacy: { value: { archived: 1 } } },
          },
        },
      },
      '400': errorResponse('Invalid request'),
    },
  };
}
function handoffClientOperation(operation: JsonSchema): JsonSchema {
  return {
    ...operation,
    description:
      'Optionally validates routineHandoff.expectedSignature and assigns/clears workouts atomically. A changed preview returns 409 with code ROUTINE_HANDOFF_CHANGED and no writes.',
    requestBody: { required: true, content: { 'application/json': { schema: toJsonSchema(UpdateClientDto.schema) } } },
    responses: {
      ...(operation.responses as JsonSchema),
      '200': { description: 'Updated client', content: { 'application/json': { schema: toJsonSchema(clientViewSchema) } } },
      '400': errorResponse('Invalid request'),
      '409': errorResponse('Planning changed; review the updated preview'),
    },
  };
}
