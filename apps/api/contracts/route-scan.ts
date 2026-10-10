import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { PAGINATION_KEYS, type DtoFields, readDtoFields } from './dto-fields';
import {
  decoratorCalls,
  decoratorName,
  httpDecorator,
  identifierArgs,
  joinPaths,
  namedDecorator,
  stringArg,
  stringArgs,
  typeName,
} from './route-decorators';

export type RouteRecord = {
  auth: boolean;
  bodyDto: string | null;
  controller: string;
  cron: boolean;
  file: string;
  filters: string[];
  guards: string[];
  headers: string[];
  method: string;
  multipart: boolean;
  pagination: string[];
  path: string;
  roles: string[];
};

export function scanControllers(modulesRoot: string): RouteRecord[] {
  const fields = readDtoFields(modulesRoot);
  const routes = walk(modulesRoot)
    .filter((file) => file.endsWith('.controller.ts'))
    .flatMap((file) => scanFile(file, fields));
  return mergeRoutes(routes).sort(compareRoutes);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function scanFile(file: string, fields: DtoFields): RouteRecord[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const routes: RouteRecord[] = [];
  source.forEachChild((node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      routes.push(...scanClass(node, file, fields));
    }
  });
  return routes;
}

function scanClass(node: ts.ClassDeclaration, file: string, fields: DtoFields): RouteRecord[] {
  const controller = namedDecorator(node, 'Controller');
  const prefix = controller ? (stringArg(controller) ?? '') : '';
  const classRoles = rolesOf(node);
  const classGuards = guardsOf(node);
  return node.members.filter(ts.isMethodDeclaration).flatMap((method) => {
    const http = httpDecorator(method);
    if (!http) {
      return [];
    }
    const methodName = decoratorName(http);
    return [
      buildRoute({
        classGuards,
        classRoles,
        fields,
        file,
        method,
        methodName: methodName ?? 'Get',
        name: node.name?.text ?? 'Controller',
        prefix,
        subPath: stringArg(http) ?? '',
      }),
    ];
  });
}

type RouteDraft = {
  classGuards: string[];
  classRoles: string[];
  fields: DtoFields;
  file: string;
  method: ts.MethodDeclaration;
  methodName: string;
  name: string;
  prefix: string;
  subPath: string;
};

function buildRoute(draft: RouteDraft): RouteRecord {
  const methodRoles = rolesOf(draft.method);
  const guards = [...draft.classGuards, ...guardsOf(draft.method)];
  const inputs = parameterInputs(draft.method, draft.fields);
  return {
    auth: guards.includes('AuthGuard'),
    bodyDto: inputs.bodyDto,
    controller: draft.name,
    cron: guards.includes('CronSecretGuard'),
    file: path.basename(draft.file),
    filters: inputs.filters,
    guards,
    headers: inputs.headers,
    method: draft.methodName.toLowerCase(),
    multipart: inputs.multipart,
    pagination: inputs.pagination,
    path: joinPaths(draft.prefix, draft.subPath),
    roles: methodRoles.length > 0 ? methodRoles : draft.classRoles,
  };
}

function rolesOf(node: ts.Node): string[] {
  const roles = namedDecorator(node, 'Roles');
  return roles ? stringArgs(roles) : [];
}

function guardsOf(node: ts.Node): string[] {
  return decoratorCalls(node)
    .filter((call) => decoratorName(call) === 'UseGuards')
    .flatMap((call) => identifierArgs(call));
}

function compareRoutes(left: RouteRecord, right: RouteRecord): number {
  return left.path.localeCompare(right.path) || left.method.localeCompare(right.method);
}

function mergeRoutes(routes: RouteRecord[]): RouteRecord[] {
  const merged = new Map<string, RouteRecord>();
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    const current = merged.get(key);
    merged.set(key, current ? combineRoutes(current, route) : route);
  }
  return [...merged.values()];
}

function combineRoutes(left: RouteRecord, right: RouteRecord): RouteRecord {
  return {
    ...left,
    auth: left.auth || right.auth,
    bodyDto: left.bodyDto ?? right.bodyDto,
    cron: left.cron || right.cron,
    filters: unique([...left.filters, ...right.filters]),
    guards: unique([...left.guards, ...right.guards]),
    headers: unique([...left.headers, ...right.headers]),
    multipart: left.multipart || right.multipart,
    pagination: unique([...left.pagination, ...right.pagination]),
    roles: unique([...left.roles, ...right.roles]),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

type ParameterInputs = {
  bodyDto: string | null;
  filters: string[];
  headers: string[];
  multipart: boolean;
  pagination: string[];
};

function parameterInputs(method: ts.MethodDeclaration, fields: DtoFields): ParameterInputs {
  const filters: string[] = [];
  const pagination: string[] = [];
  const headers: string[] = [];
  let bodyDto: string | null = null;
  let multipart = false;
  for (const param of method.parameters) {
    const input = readParameter(param, fields);
    filters.push(...input.filters);
    pagination.push(...input.pagination);
    headers.push(...input.headers);
    bodyDto = bodyDto ?? input.bodyDto;
    multipart = multipart || input.multipart;
  }
  return { bodyDto, filters: unique(filters), headers: unique(headers), multipart, pagination: unique(pagination) };
}

function readParameter(param: ts.ParameterDeclaration, fields: DtoFields): ParameterInputs {
  const query = namedDecorator(param, 'Query');
  const header = namedDecorator(param, 'Headers');
  const body = namedDecorator(param, 'Body');
  const uploaded = namedDecorator(param, 'UploadedFile');
  const dto = typeName(param.type);
  const keys = dto ? (fields.get(dto) ?? []) : [];
  const named = query ? stringArg(query) : null;
  const queryKeys = named ? [named] : query ? keys : [];
  return {
    bodyDto: body ? dto : null,
    filters: queryKeys.filter((key) => !PAGINATION_KEYS.has(key)),
    headers: header ? [stringArg(header) ?? 'header'].filter((key) => key.length > 0) : [],
    multipart: Boolean(uploaded),
    pagination: queryKeys.filter((key) => PAGINATION_KEYS.has(key)),
  };
}
