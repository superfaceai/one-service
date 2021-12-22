import {
  DocumentedStructure,
  DocumentedStructureType,
  EnumStructure,
  PrimitiveStructure,
  ProfileId,
  ScalarStructure,
  StructureType,
} from '@superfaceai/parser';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLString,
} from 'graphql';
import createDebug from 'debug';
import { DEBUG_PREFIX } from './constants';
import { ProfileDocumentNode } from '@superfaceai/ast';

const debug = createDebug(`${DEBUG_PREFIX}:schema-utils`);

/**
 * Creates valid field name
 * GQL allowed: [_a-zA-Z][_a-zA-Z0-9]
 * Comlink allowed: [a-z][a-z0-9_-] + scope delimiter /
 */
export function sanitize(input: string): string {
  return input.replace(/\//g, '_').replace(/-/g, '_');
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.substring(1);
}

export function camelize(input: string): string {
  return input.replace(/[-_/](\w)/g, (_, repl) => {
    return capitalize(repl);
  });
}

export function pascalize(input: string): string {
  return capitalize(camelize(input));
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

/**
 * Converts Comlink primitive types to GraphQL scalars
 */
export function primitiveType(
  _name: string,
  structure: PrimitiveStructure,
): GraphQLScalarType {
  switch (structure.type) {
    case 'string':
      return GraphQLString; // http://spec.graphql.org/October2021/#sec-String
    case 'number':
      return GraphQLInt; // http://spec.graphql.org/October2021/#sec-Int
    case 'boolean':
      return GraphQLBoolean; // http://spec.graphql.org/October2021/#sec-Boolean
    case undefined:
      return GraphQLString; // If not spoecified in Comlink assume string
  }
}

export function scalarType(
  name: string,
  structure: ScalarStructure,
): GraphQLScalarType {
  return new GraphQLScalarType({
    name,
    description: description(structure),
  });
}

export function enumType(
  name: string,
  structure: EnumStructure,
): GraphQLEnumType {
  const values: GraphQLEnumValueConfigMap = {};

  structure.enums.forEach((enumValue) => {
    values[sanitize(String(enumValue.value))] = {
      value: enumValue.value,
      description: description(enumValue),
    };
  });

  return new GraphQLEnumType({
    name,
    values,
    description: description(structure),
  });
}

export function outputType(
  name: string,
  structure: StructureType,
): GraphQLOutputType {
  debug(`outputType for ${name} from ${structure.kind}`);

  switch (structure.kind) {
    case 'PrimitiveStructure':
      return primitiveType(name, structure);

    case 'ScalarStructure':
      return scalarType(name, structure);

    case 'EnumStructure':
      return enumType(name, structure);

    case 'ObjectStructure':
      const fields: GraphQLFieldConfigMap<any, any> = {};

      Object.entries(structure.fields ?? {}).forEach(
        ([fieldName, innerStructure]) => {
          const fieldConfig: GraphQLFieldConfig<any, any> = {
            type: outputType(`${name}${pascalize(fieldName)}`, innerStructure),
            description: isDocumentedStructure(innerStructure)
              ? description(innerStructure)
              : undefined,
          };

          fields[fieldName] = fieldConfig;
        },
      );

      return new GraphQLObjectType({
        name,
        fields,
      });

    case 'ListStructure':
      return GraphQLList(outputType(name, structure.value));

    case 'NonNullStructure':
      return GraphQLNonNull(outputType(name, structure.value));

    default:
      throw new Error(`Variable type not implemented for: ${structure.kind}`);
  }
}

export function inputType(
  name: string,
  structure: StructureType,
): GraphQLInputType {
  debug(`inputType for ${name} from ${structure.kind}`);

  switch (structure.kind) {
    case 'PrimitiveStructure':
      return primitiveType(name, structure);

    case 'ScalarStructure':
      return scalarType(name, structure);

    case 'EnumStructure':
      return enumType(name, structure);

    case 'ObjectStructure':
      const fields: GraphQLInputFieldConfigMap = {};

      Object.entries(structure.fields ?? {}).forEach(
        ([fieldName, innerStructure]) => {
          const fieldConfig: GraphQLInputFieldConfig = {
            type: inputType(`${name}${pascalize(fieldName)}`, innerStructure),
            description: isDocumentedStructure(innerStructure)
              ? description(innerStructure)
              : undefined,
          };

          fields[fieldName] = fieldConfig;
        },
      );

      return new GraphQLInputObjectType({
        name,
        fields,
      });

    case 'ListStructure':
      return GraphQLList(inputType(name, structure.value));

    case 'NonNullStructure':
      return GraphQLNonNull(inputType(name, structure.value));

    default:
      throw new Error(`Variable type not implemented for: ${structure.kind}`);
  }
}
