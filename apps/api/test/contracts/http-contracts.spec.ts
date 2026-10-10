import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  chatMessageListSchema,
  clientListResponseSchema,
  sessionViewSchema,
  strengthPlanListItemSchema,
  strengthPlanListResponseSchema,
} from '@trainerpro/shared';
import { findBreakingChanges, type OpenApiDocument } from '../../contracts/breaking-changes';
import { buildOpenApiDocument } from '../../contracts/openapi-document';
import {
  chatMessagesExample,
  clientListExample,
  sessionExample,
  strengthPlanListExample,
  strengthPlanSummaryExample,
  THREAD_ID,
} from '../../contracts/examples';
import { scanControllers, type RouteRecord } from '../../contracts/route-scan';
import { ListChatMessagesQueryDto } from '../../src/modules/chat/presentation/dto/list-chat-messages-query.dto';
import { mapClientOutput } from '../../src/modules/clients/presentation/controllers/clients.controller.mappers';
import { mapTemplateOutput } from '../../src/modules/plans/presentation/controllers/plans.controller';
import { SessionIdParamDto } from '../../src/modules/sessions/presentation/dto/session-id-param.dto';
import { mapSession } from '../../src/modules/sessions/presentation/controllers/sessions.controller';
import { chatMessageFixture, clientFixture, planTemplateFixture, sessionFixture } from './fixtures';

const modulesRoot = path.resolve('src/modules');
const specPath = path.resolve('openapi.json');

describe('HTTP contract examples', () => {
  beforeAll(() => {
    process.env.PUBLIC_ASSET_BASE_URL = 'http://localhost:8080';
  });

  it('accepts the client, plan, session and chat examples', () => {
    expect(clientListResponseSchema.parse(clientListExample)).toEqual(clientListExample);
    expect(strengthPlanListResponseSchema.parse(strengthPlanListExample)).toEqual(strengthPlanListExample);
    expect(strengthPlanListItemSchema.parse(strengthPlanSummaryExample)).toEqual(strengthPlanSummaryExample);
    expect(sessionViewSchema.parse(sessionExample)).toEqual(sessionExample);
    expect(chatMessageListSchema.parse(chatMessagesExample)).toEqual(chatMessagesExample);
  });

  it('accepts the request examples', () => {
    ListChatMessagesQueryDto.schema.parse({ threadId: THREAD_ID });
    SessionIdParamDto.schema.parse({ sessionId: sessionExample.id });
    expect(strengthPlanListExample.items).toHaveLength(1);
  });

  it('matches the JSON produced by the mappers', () => {
    const client = { items: [mapClientOutput(clientFixture())] };
    const plan = { items: [mapTemplateOutput(planTemplateFixture())] };
    const session = mapSession(sessionFixture());
    const messages = [chatMessageFixture()];
    expect(clientListResponseSchema.parse(wire(client))).toEqual(clientListExample);
    expect(strengthPlanListResponseSchema.parse(wire(plan))).toEqual(strengthPlanListExample);
    expect(sessionViewSchema.parse(wire(session))).toEqual(sessionExample);
    expect(chatMessageListSchema.parse(wire(messages))).toEqual(chatMessagesExample);
  });
});

describe('HTTP route inventory', () => {
  const routes = scanControllers(modulesRoot);

  it('records roles, filters and pagination without inventing pages', () => {
    expect(route(routes, 'get', '/health')?.auth).toBe(false);
    expect(route(routes, 'get', '/clients')).toMatchObject({ filters: [], pagination: [], roles: ['coach'] });
    expect(route(routes, 'get', '/plans/templates/strength')?.filters).toEqual(['summary']);
    expect(route(routes, 'get', '/sessions/{sessionId}')?.roles).toEqual(['coach', 'client']);
    expect(route(routes, 'get', '/chat/messages')).toMatchObject({
      filters: ['threadId'],
      pagination: [],
      roles: ['coach', 'client'],
    });
    expect(route(routes, 'get', '/clients/me/exercises/{sourceExerciseId}/history')?.pagination).toEqual(['limit']);
    expect(routes.length).toBeGreaterThan(40);
  });

  it('matches the committed OpenAPI document', () => {
    const generated = buildOpenApiDocument(routes);
    expect(generated).toEqual(JSON.parse(fs.readFileSync(specPath, 'utf8')));
    expect(findBreakingChanges(generated, generated)).toEqual([]);
    const baseline = readBaseline();
    if (baseline) {
      expect(findBreakingChanges(baseline, generated)).toEqual([]);
    }
  });
});

function route(routes: RouteRecord[], method: string, pathName: string): RouteRecord | undefined {
  return routes.find((item) => item.method === method && item.path === pathName);
}

function wire(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function readBaseline(): OpenApiDocument | null {
  try {
    const output = execFileSync('git', ['show', 'origin/main:apps/api/openapi.json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(output) as OpenApiDocument;
  } catch {
    return null;
  }
}
