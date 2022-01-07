import {
  NormalizedProfileSettings,
  ProfileDocumentNode,
} from '@superfaceai/ast';
import { ProfileId } from '@superfaceai/cli/dist/common/profile';
import {
  EnumStructure,
  getProfileOutput,
  getProfileUsecases,
  PrimitiveStructure,
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
  description,
  hasFieldsDefined,
  isDocumentedStructure,
  pascalize,
  sanitize,
  typeFromSafety,
} from './schema.utils';

const debug = createDebug(`${DEBUG_PREFIX}:schema`);

export async function generateProfileTypes(
  profilePrefix: string,
  profileAst: ProfileDocumentNode,
  profileSettings: NormalizedProfileSettings,
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

  const InputType = useCase.input
    ? generateStructureInputType(`${useCasePrefix}Input`, useCase.input)
    : undefined;

  const OptionsType = generateUseCaseOptionsInputType(
    `${useCasePrefix}Options`,
    profileSettings,
  );

  const args: GraphQLFieldConfigArgumentMap = {
    options: {
      type: OptionsType,
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
      ProfileId.fromScopeName(
        profileAst.header.scope,
        profileAst.header.name,
      ).toString(),
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

export function generateUseCaseOptionsInputType(
  name: string,
  profileSettings: NormalizedProfileSettings,
): GraphQLInputObjectType {
  const providersNames = Object.keys(profileSettings.providers);

  debug(
    `generateUseCaseOptionsInputType for ${name} with providers: ${providersNames.join(
      ', ',
    )}`,
  );

  const values: GraphQLEnumValueConfigMap = {};

  providersNames.forEach((value) => {
    values[sanitize(value)] = { value };
  });

  return new GraphQLInputObjectType({
    name,
    description: 'Additional options to pass to OneSDK perform function',
    fields: {
      provider: {
        type: new GraphQLEnumType({
          name: `${name}ProviderEnum`,
          values,
        }),
      },
    },
  });
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
