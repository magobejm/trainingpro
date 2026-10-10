import ts from 'typescript';

const HTTP_METHODS = new Set(['Delete', 'Get', 'Head', 'Options', 'Patch', 'Post', 'Put']);

export function decoratorCalls(node: ts.Node): ts.CallExpression[] {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }
  return (ts.getDecorators(node) ?? []).map((decorator) => decorator.expression).filter(ts.isCallExpression);
}

export function decoratorName(call: ts.CallExpression): string | null {
  if (ts.isIdentifier(call.expression)) {
    return call.expression.text;
  }
  if (ts.isPropertyAccessExpression(call.expression)) {
    return call.expression.name.text;
  }
  return null;
}

export function stringArg(call: ts.CallExpression, index = 0): string | null {
  const arg = call.arguments[index];
  return arg && ts.isStringLiteral(arg) ? arg.text : null;
}

export function stringArgs(call: ts.CallExpression): string[] {
  return call.arguments.filter(ts.isStringLiteral).map((arg) => arg.text);
}

export function identifierArgs(call: ts.CallExpression): string[] {
  return call.arguments.filter(ts.isIdentifier).map((arg) => arg.text);
}

export function httpDecorator(node: ts.Node): ts.CallExpression | null {
  return decoratorCalls(node).find((call) => HTTP_METHODS.has(decoratorName(call) ?? '')) ?? null;
}

export function namedDecorator(node: ts.Node, name: string): ts.CallExpression | null {
  return decoratorCalls(node).find((call) => decoratorName(call) === name) ?? null;
}

export function typeName(type: ts.TypeNode | undefined): string | null {
  if (type && ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    return type.typeName.text;
  }
  return null;
}

export function joinPaths(prefix: string, sub: string): string {
  const parts = `${prefix}/${sub}`.split('/').filter((part) => part.length > 0);
  return `/${parts.join('/')}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}
