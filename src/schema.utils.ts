import { ProfileDocumentNode } from '@superfaceai/ast';
import {
  DocumentedStructure,
  DocumentedStructureType,
  ProfileId,
  StructureType,
} from '@superfaceai/parser';
import { GraphQLFieldConfigMap, GraphQLInputFieldConfigMap } from 'graphql';

/**
 * Creates valid field name
 * GQL allowed: [_a-zA-Z][_a-zA-Z0-9]
 * Comlink allowed: [a-z][a-z0-9_-] + scope delimiter /
 */
export function sanitize(input: string): string {
  return input.replace(/[-_/]/g, '_');
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.substring(1);
}

export function camelize(input: string): string {
  return input.replace(/[-_/](\w)/g, (_, repl) => {
    return capitalize(repl);
  });
}

export function snake_cased(input: string): string {
  return input.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function pascalize(input: string): string {
  return capitalize(camelize(input));
}

export function sanitizeForGQLTypeName(input: string): string {
  return pascalize(sanitize(input));
}

export function sanitizedProfileName(profileAst: ProfileDocumentNode): string {
  return pascalize(
    sanitize(
      ProfileId.fromParameters({
        scope: profileAst.header.scope,
        name: profileAst.header.name,
      }).toString(),
    ),
  );
}

/**
 * Sanitization can be reversed by desanitizeProviderName
 */
export function sanitizeForFieldName(input: string): string {
  return input.replace(/-/g, '__');
}

/**
 * Inversed sanitizeForFieldName
 */
export function desanitizeForFieldName(input: string): string {
  return input.replace(/__/g, '-');
}

export function hasFieldsDefined(
  config: GraphQLFieldConfigMap<unknown, unknown> | GraphQLInputFieldConfigMap,
): boolean {
  return Object.keys(config).length > 0;
}

/**
 * Checks if a structure has doc strings
 */
export function isDocumentedStructure(
  structure: StructureType,
): structure is DocumentedStructureType {
  return 'title' in structure;
}

export function description(
  structure: DocumentedStructure,
): string | undefined {
  if (!structure.title) {
    return undefined;
  }

  return `${structure.title}\n${structure.description ?? ''}`.trim();
}

export function typeFromSafety(
  safety?: 'safe' | 'unsafe' | 'idempotent',
): 'query' | 'mutation' {
  switch (safety) {
    case 'safe':
      return 'query';
    case 'unsafe':
      return 'mutation';
    case 'idempotent':
      return 'mutation';
    default:
      return 'mutation';
  }
}
