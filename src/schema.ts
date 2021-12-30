import {
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  printSchema,
} from 'graphql';

import { SuperJson, META_FILE } from '@superfaceai/one-sdk';
import {
  isDocumentDefinition,
  NormalizedProfileSettings,
  ProfileDocumentNode,
} from '@superfaceai/ast';
import {
  DocumentedStructure,
  getProfileOutput,
  getProfileUsecases,
  StructureType,
  UseCaseStructure,
} from '@superfaceai/parser';
import { loadProfile } from '@superfaceai/cli/dist/logic/publish.utils';
import createDebug from 'debug';
import { join as joinPath } from 'path';
import { DEBUG_PREFIX } from './constants';
import { createResolver } from './oneSdk';
import {
  description,
  hasFieldsDefined,
  inputType,
  outputType,
  pascalize,
  sanitize,
  sanitizedProfileName,
  typeFromSafety,
} from './schema.utils';
import { ProfileId } from '@superfaceai/cli/dist/common/profile';

const debug = createDebug(`${DEBUG_PREFIX}:schema`);

export async function createSchema(): Promise<GraphQLSchema> {
  const superJson = await loadSuperJson();
  return await generate(superJson);
}

export async function loadSuperJson(): Promise<SuperJson> {
  const superPath = await SuperJson.detectSuperJson(process.cwd());
  if (!superPath) {
    throw new Error('Unable to generate, super.json not found');
  }

  const loadedResult = await SuperJson.load(joinPath(superPath, META_FILE));
  return loadedResult.match(
    (v) => v,
    (err) => {
      throw new Error(`Unable to load super.json: ${err.formatShort()}`);
    },
  );
}

export async function generate(superJson: SuperJson): Promise<GraphQLSchema> {
  const queryFields: GraphQLFieldConfigMap<any, any> = {};
  const mutationFields: GraphQLFieldConfigMap<any, any> = {};

  for (const [profile, profileSettings] of Object.entries(
    superJson.normalized.profiles,
  )) {
    debug(`generate start for ${profile}`);

    // TODO: can it be done without CLI?
    const loadedProfile = await loadProfile(
      superJson,
      ProfileId.fromId(profile),
    );

    const profilePrefix = sanitizedProfileName(loadedProfile.ast);

    const { QueryType, MutationType } = await generateProfileTypes(
      profilePrefix,
      loadedProfile.ast,
      profileSettings,
    );

    if (QueryType) {
      if (queryFields[profilePrefix]) {
        throw new Error(`Profile name collision in Query: ${profilePrefix}`);
      }

      queryFields[profilePrefix] = profileConfig(QueryType, loadedProfile.ast);
    }

    if (MutationType) {
      if (mutationFields[profilePrefix]) {
        throw new Error(`Profile name collision in Mutation: ${profilePrefix}`);
      }

      mutationFields[profilePrefix] = profileConfig(
        MutationType,
        loadedProfile.ast,
      );
    }
  }

  const schema = new GraphQLSchema({
    description: 'Superface.ai ❤️',
    query: new GraphQLObjectType({
      name: 'Query',
      description: "Profile's safe use-cases",
      fields: queryFields,
    }),
    mutation: hasFieldsDefined(mutationFields)
      ? new GraphQLObjectType({
          name: 'Mutation',
          description: "Profile's unsafe and idempotent use-cases",
          fields: mutationFields,
        })
      : undefined,
  });

  debug('generated schema:\n', printSchema(schema));

  return schema;
}

export function profileConfig(
  type: GraphQLOutputType,
  profileAst: ProfileDocumentNode,
): GraphQLFieldConfig<any, any> {
  return {
    description: isDocumentDefinition(profileAst.header.documentation)
      ? description(profileAst.header.documentation as DocumentedStructure)
      : undefined,
    type,
    // hack if nonscalar value is returned execution will continue towards leaves (our use-case) https://graphql.org/learn/execution/
    // we need this to skip profile to run resolver on usecase
    resolve: () => ({}),
  };
}

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
      throw new Error('Can find useCase info');
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
