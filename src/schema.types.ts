import {
  NormalizedProfileSettings,
  ProfileDocumentNode,
  ProviderJson,
} from '@superfaceai/ast';
import {
  EnumStructure,
  getProfileOutput,
  getProfileUsecases,
  PrimitiveStructure,
  ProfileId,
  ScalarStructure,
  StructureType,
  UseCaseStructure,
} from '@superfaceai/parser';
import createDebug from 'debug';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
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
import { DEBUG_PREFIX } from './constants';
import { createResolver } from './one_sdk';
import {
  capitalize,
  description,
  hasFieldsDefined,
  isDocumentedStructure,
  pascalize,
  sanitize,
  typeFromSafety,
} from './schema.utils';
import { ArrayMultiMap } from './structures';

const debug = createDebug(`${DEBUG_PREFIX}:schema`);

export type ProvidersJsonRecord = Record<string, ProviderJson>;

export async function generateProfileTypes(
  profilePrefix: string,
  profileAst: ProfileDocumentNode,
  profileSettings: NormalizedProfileSettings,
  providersJsons: ProvidersJsonRecord,
): Promise<{
  QueryType?: GraphQLObjectType;
  MutationType?: GraphQLObjectType;
}> {
  debug('generateProfileTypes profilePrefix', profilePrefix);

  const output = getProfileOutput(profileAst);
  debug('generateProfileTypes profile output:', output);

  const useCasesInfo = getProfileUsecases(profileAst);
  debug('generateProfileTypes profile usecases info:', useCasesInfo);

  const queryFields: GraphQLFieldConfigMap<any, any> = {}; // TODO: something better than any?
  const mutationFields: GraphQLFieldConfigMap<any, any> = {}; // TODO: something better than any?

  for (const useCase of output.usecases) {
    const useCaseInfo = useCasesInfo.find(
      (uc) => uc.name === useCase.useCaseName,
    );

    if (!useCaseInfo) {
      throw new Error('Missing usecase information');
    }

    const useCaseFieldConfig = generateUseCaseFieldConfig(
      profilePrefix,
      profileAst,
      profileSettings,
      useCase,
      providersJsons,
    );

    const type = typeFromSafety(useCaseInfo.safety);
    if (type === 'query') {
      queryFields[useCase.useCaseName] = useCaseFieldConfig;
    } else {
      mutationFields[useCase.useCaseName] = useCaseFieldConfig;
    }
  }

  return {
    QueryType: hasFieldsDefined(queryFields)
      ? new GraphQLObjectType({
          name: `${profilePrefix}Query`,
          description: description(output),
          fields: queryFields,
        })
      : undefined,
    MutationType: hasFieldsDefined(mutationFields)
      ? new GraphQLObjectType({
          name: `${profilePrefix}Mutation`,
          description: description(output),
          fields: mutationFields,
        })
      : undefined,
  };
}

export function generateUseCaseFieldConfig(
  profilePrefix: string,
  profileAst: ProfileDocumentNode,
  profileSettings: NormalizedProfileSettings,
  useCase: UseCaseStructure,
  providersJsons: ProvidersJsonRecord,
): GraphQLFieldConfig<any, any> {
  if (!useCase.result) {
    throw new Error(`${useCase.useCaseName} doesn't have defined result`);
  }

  const useCasePrefix = `${profilePrefix}${pascalize(
    sanitize(useCase.useCaseName),
  )}`;

  const ResultType = generateStructureResultType(
    `${useCasePrefix}Result`,
    useCase.result,
  );

  const InputType =
    useCase.input && Object.keys(useCase.input.fields).length !== 0
      ? generateStructureInputType(`${useCasePrefix}Input`, useCase.input)
      : undefined;

  const ProfileProviderOptionType = generateProfileProviderOptionInputType(
    `${profilePrefix}ProviderOption`,
    profileSettings,
    providersJsons,
  );

  const args: GraphQLFieldConfigArgumentMap = {
    provider: {
      type: ProfileProviderOptionType,
    },
  };

  if (InputType) {
    args.input = {
      description: 'Use-case inputs',
      type: InputType,
    };
  }

  return {
    description: description(useCase),
    type: ResultType,
    args,
    resolve: createResolver(
      ProfileId.fromParameters({
        scope: profileAst.header.scope,
        name: profileAst.header.name,
      }).toString(),
      useCase.useCaseName,
    ),
  };
}

export function generateProfileConfig(
  type: GraphQLOutputType,
  profileAst: ProfileDocumentNode,
): GraphQLFieldConfig<any, any> {
  return {
    description: profileAst.header.documentation?.title
      ? description({
          title: profileAst.header.documentation.title,
          description: profileAst.header.documentation.description,
        })
      : undefined,
    type,
    // hack if nonscalar value is returned execution will continue towards leaves (our use-case) https://graphql.org/learn/execution/
    // we need this to skip profile to run resolver on usecase
    resolve: () => ({}),
  };
}

export function generateStructureResultType(
  name: string,
  structure: StructureType,
): GraphQLOutputType {
  debug(`generateStructureResultType for ${name} from structure`, structure);

  const type = outputType(`${name}Node`, structure);

  return new GraphQLObjectType({
    name,
    description:
      'Wrapping type to handle many possible types returned as result by OneSDK',
    fields: {
      result: {
        type,
      },
    },
  });
}

export function generateStructureInputType(
  name: string,
  structure: StructureType,
): GraphQLInputType {
  debug(`generateStructureInputType for ${name} from structure`, structure);

  return inputType(name, structure);
}

export function generateProfileProviderOptionInputType(
  name: string,
  profileSettings: NormalizedProfileSettings,
  providersJsons: ProvidersJsonRecord,
): GraphQLInputObjectType {
  const providersNames = Object.keys(profileSettings.providers);

  debug(
    `generateProfileProviderOptionInputType for ${name} with providers: ${providersNames.join(
      ', ',
    )}`,
  );

  const values: GraphQLEnumValueConfigMap = {};

  providersNames.forEach((value) => {
    values[sanitize(value)] = { value };
  });

  const providerFields: GraphQLInputFieldConfigMap = {};

  for (const providerName of providersNames) {
    const providerParameters = generateUseCaseProviderParametersFields(
      providersJsons,
      [providerName],
    );

    const security = generateUseCaseSecurityFields(providersJsons, [
      providerName,
    ]);

    const configurationFields = {
      ...(providerParameters && {
        parameters: {
          type: new GraphQLInputObjectType({
            name: `${name}${pascalize(providerName)}ProviderParameters`,
            description: 'Provider-specific parameters',
            fields: providerParameters,
          }),
        },
      }),
      ...(security && {
        security: {
          type: new GraphQLInputObjectType({
            name: `${name}${pascalize(providerName)}ProviderSecurity`,
            description: 'Provider-specific security',
            fields: security,
          }),
        },
      }),
    };

    providerFields[providerName] = {
      description: `Provider ${providerName} configuration`,
      type: new GraphQLInputObjectType({
        name: `${name}${pascalize(providerName)}Config`,
        fields: { active: { type: GraphQLBoolean }, ...configurationFields },
      }),
    };
  }

  return new GraphQLInputObjectType({
    name,
    description: 'Provider configuration for OneSDK perform',
    fields: providerFields,
  });
}

export function generateUseCaseProviderParametersFields(
  allProvidersJsons: ProvidersJsonRecord,
  configuredProviders: string[],
): GraphQLInputFieldConfigMap | undefined {
  // Set to prevent duplicated fields; it's okay if there are conflicting fields since we always expect a string
  const parametersWithProviders = new ArrayMultiMap<string, string>();

  // Generate a union of all parameters' names by all configured providers
  for (const providerName of configuredProviders) {
    const providerSettings = allProvidersJsons[providerName];

    if (!providerSettings) {
      throw new Error(
        `Super.json missconfigured, provider '${providerName}' not configured`,
      );
    }

    const parameters = providerSettings.parameters ?? [];
    parameters.forEach((parameter) =>
      parametersWithProviders.set(parameter.name, providerName),
    );
  }

  if (parametersWithProviders.size === 0) {
    return undefined;
  }

  debug(
    'generateUseCaseProviderParametersFields found provider parameters %o',
    parametersWithProviders,
  );

  const fields: GraphQLInputFieldConfigMap = {};
  for (const [parameterName, providers] of parametersWithProviders) {
    fields[parameterName] = {
      description: `Parameter accepted by ${providers.join(', ')}`,
      type: GraphQLString,
    };
  }

  return fields;
}

export function generateUseCaseSecurityFields(
  allProvidersJsons: ProvidersJsonRecord,
  configuredProviders: string[],
): GraphQLInputFieldConfigMap | undefined {
  const fields: GraphQLInputFieldConfigMap = {};

  for (const providerName of configuredProviders) {
    const providerJson = allProvidersJsons[providerName];

    providerJson.securitySchemes?.forEach((schema) => {
      let type: GraphQLInputType;

      if (schema.type === 'http') {
        if (schema.scheme === 'basic') {
          type = new GraphQLInputObjectType({
            name: `${capitalize(providerName)}${pascalize(
              sanitize(schema.id),
            )}SecurityValues`,
            fields: {
              username: {
                type: GraphQLString,
              },
              password: {
                type: GraphQLString,
              },
            },
          });
        } else if (schema.scheme === 'bearer') {
          type = new GraphQLInputObjectType({
            name: `${capitalize(providerName)}${pascalize(
              sanitize(schema.id),
            )}SecurityValues`,
            fields: {
              token: {
                type: GraphQLString,
              },
            },
          });
        } else if (schema.scheme === 'digest') {
          type = new GraphQLInputObjectType({
            name: `${capitalize(providerName)}${pascalize(
              sanitize(schema.id),
            )}SecurityValues`,
            fields: {
              username: {
                type: GraphQLString,
              },
              password: {
                type: GraphQLString,
              },
            },
          });
        } else {
          throw new Error(
            `Unsupported security scheme. Error in security schema definition for provider ${providerName}`,
          );
        }
      } else if (schema.type === 'apiKey') {
        type = new GraphQLInputObjectType({
          name: `${capitalize(providerName)}${pascalize(
            sanitize(schema.id),
          )}SecurityValues`,
          fields: {
            apikey: {
              type: GraphQLString,
            },
          },
        });
      } else {
        throw new Error(
          `Unsupported security scheme. Error in security schema definition for provider ${providerName}`,
        );
      }

      fields[schema.id] = {
        description: `Security accepted by ${providerName}`,
        type,
      };
    });
  }

  if (!hasFieldsDefined(fields)) {
    return undefined;
  }

  return fields;
}

export function generateRootQueryType(
  profileTypes: GraphQLObjectType[],
): GraphQLObjectType | null {
  return generateRootType('Query', profileTypes);
}

export function generateRootMutationType(
  profileTypes: GraphQLObjectType[],
): GraphQLObjectType | null {
  return generateRootType('Mutation', profileTypes);
}

export function generateRootType(
  name: string,
  profileTypes: GraphQLObjectType[],
): GraphQLObjectType | null {
  if (profileTypes.length === 0) {
    return null;
  }

  const fields: GraphQLFieldConfigMap<any, any> = {}; // TODO: something better then 'any'?

  for (const ProfileType of profileTypes) {
    fields[ProfileType.name] = {
      type: ProfileType,
      // hack if nonscalar value is returned execution will continue towards leaves (our use-case) https://graphql.org/learn/execution/
      // we need this to skip profile to run resolver on usecase
      resolve: () => ({}),
    };
  }

  return new GraphQLObjectType({
    name,
    fields,
  });
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
    default:
      throw new Error(
        `Unable to translate structure of type ${structure.type} to GhraphQL type`,
      );
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
    values[sanitize(String(enumValue.name ?? enumValue.value))] = {
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
      return new GraphQLList(outputType(name, structure.value));

    case 'NonNullStructure':
      return new GraphQLNonNull(outputType(name, structure.value));

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
      return new GraphQLList(inputType(name, structure.value));

    case 'NonNullStructure':
      return new GraphQLNonNull(inputType(name, structure.value));

    default:
      throw new Error(`Variable type not implemented for: ${structure.kind}`);
  }
}
