import { ProfileId } from '@superfaceai/cli/dist/common/profile';
import { loadProfile } from '@superfaceai/cli/dist/logic/publish.utils';
import { META_FILE, SuperJson } from '@superfaceai/one-sdk';
import createDebug from 'debug';
import {
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from 'graphql';
import { join as joinPath } from 'path';
import { DEBUG_PREFIX } from './constants';
import { generateProfileConfig, generateProfileTypes } from './schema.types';
import { hasFieldsDefined, sanitizedProfileName } from './schema.utils';

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

      queryFields[profilePrefix] = generateProfileConfig(
        QueryType,
        loadedProfile.ast,
      );
    }

    if (MutationType) {
      if (mutationFields[profilePrefix]) {
        throw new Error(`Profile name collision in Mutation: ${profilePrefix}`);
      }

      mutationFields[profilePrefix] = generateProfileConfig(
        MutationType,
        loadedProfile.ast,
      );
    }
  }

  queryFields['_superJson'] = superJsonFieldConfig();

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

export function superJsonFieldConfig(): GraphQLFieldConfig<any, any> {
  return {
    type: new GraphQLObjectType({
      name: 'SuperJson',
      fields: {
        profiles: {
          type: new GraphQLList(
            new GraphQLObjectType({
              name: 'ProfileInfo',
              fields: {
                name: {
                  type: GraphQLString,
                },
                version: {
                  type: GraphQLString,
                },
                providers: {
                  type: new GraphQLList(GraphQLString),
                },
              },
            }),
          ),
        },
        providers: {
          type: new GraphQLList(GraphQLString),
        },
      },
    }),
    resolve: async () => {
      const superJson = await loadSuperJson();

      return {
        profiles: Object.entries(superJson.anonymized.profiles).map(
          ([name, info]) => ({
            name,
            version: info.version,
            providers: info.providers.map((p) => p.provider),
          }),
        ),
        providers: superJson.anonymized.providers,
      };
    },
  };
}
