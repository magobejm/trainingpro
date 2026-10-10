import { findBreakingChanges, type OpenApiDocument } from '../../contracts/breaking-changes';

describe('incompatible HTTP contracts', () => {
  const base = spec();

  it('flags a removed route, a removed required field, a type change and a new required parameter', () => {
    const removed = spec();
    delete removed.paths?.['/clients'];
    expect(findBreakingChanges(base, removed)).toContain('GET /clients desapareció');

    const missing = spec();
    const missingSchema = schemaOf(missing, '/clients');
    delete missingSchema.properties.id;
    missingSchema.required = [];
    expect(findBreakingChanges(base, missing)).toContain('GET /clients.id desapareció');

    const changed = spec();
    const id = schemaOf(changed, '/clients').properties.id;
    if (!id) {
      throw new Error('missing id');
    }
    id.type = 'number';
    expect(findBreakingChanges(base, changed)).toContain('GET /clients.id cambió de tipo');

    const stricter = spec();
    const chat = stricter.paths?.['/chat/messages']?.get as { parameters: unknown[] };
    chat.parameters = [...chat.parameters, { in: 'query', name: 'page', required: true }];
    expect(findBreakingChanges(base, stricter)).toContain('GET /chat/messages exige query page');
  });

  it('allows an optional field and an extra route', () => {
    const optional = spec();
    schemaOf(optional, '/clients').properties.nickname = { type: 'string' };
    expect(findBreakingChanges(base, optional)).toEqual([]);

    const extra = spec();
    extra.paths = { ...extra.paths, '/notes': { get: { responses: response() } } };
    expect(findBreakingChanges(base, extra)).toEqual([]);
  });
});

function spec(): OpenApiDocument {
  return {
    paths: {
      '/chat/messages': { get: { parameters: [{ in: 'query', name: 'threadId', required: true }], responses: response() } },
      '/clients': { get: { responses: response() } },
      '/plans/templates/strength': { get: { responses: response() } },
      '/sessions/{sessionId}': { get: { responses: response() } },
    },
  };
}

function response() {
  return {
    '200': {
      content: {
        'application/json': {
          schema: {
            properties: { id: { type: 'string' } },
            required: ['id'],
            type: 'object',
          },
        },
      },
    },
  };
}

function schemaOf(doc: OpenApiDocument, pathName: string): SchemaNode {
  const operationNode = doc.paths?.[pathName]?.get as {
    responses: { '200': { content: { 'application/json': { schema: SchemaNode } } } };
  };
  return operationNode.responses['200'].content['application/json'].schema;
}

type SchemaNode = {
  properties: Record<string, { type: string }>;
  required: string[];
};
