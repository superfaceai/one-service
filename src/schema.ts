import {
  detectSuperJson,
  META_FILE,
  loadSuperJson as sdkLoadSuperJson,
  NodeFileSystem,
  normalizeSuperJsonDocument,
} from '@superfaceai/one-sdk';
import { anonymizeSuperJson } from '@superfaceai/one-sdk/dist/core/events/reporter/utils';
import { NormalizedSuperJsonDocument } from '@superfaceai/ast';
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
import { load as loadProfile } from './profile';
import { generateProfileConfig, generateProfileTypes } from './schema.types';
import { hasFieldsDefined, sanitizedProfileName } from './schema.utils';

const debug = createDebug(`${DEBUG_PREFIX}:schema`);

export async function createSchema(): Promise<GraphQLSchema> {
  const superJson = await loadSuperJson();
  return await generate(superJson);
}

export async function loadSuperJson(): Promise<NormalizedSuperJsonDocument> {
  const superPath = await detectSuperJson(process.cwd(), NodeFileSystem);
  if (!superPath) {
    throw new Error('Unable to generate, super.json not found');
  }

  const loadedResult = await sdkLoadSuperJson(
    joinPath(superPath, META_FILE),
    NodeFileSystem,
  );

  const superJsonDocument = loadedResult.match(
    (v) => v,
    (err) => {
      throw new Error(`Unable to load super.json: ${err.formatShort()}`);
    },
  );

  return normalizeSuperJsonDocument(superJsonDocument);
}

export async function generate(
  superJson: NormalizedSuperJsonDocument,
): Promise<GraphQLSchema> {
  const queryFields: GraphQLFieldConfigMap<any, any> = {};
  const mutationFields: GraphQLFieldConfigMap<any, any> = {};

  for (const [profile, profileSettings] of Object.entries(superJson.profiles)) {
    debug(`generate start for ${profile}`);

    const loadedProfile = await loadProfile(superJson, profile);

    const profilePrefix = sanitizedProfileName(loadedProfile.ast);

    const { QueryType, MutationType } = await generateProfileTypes(
      profilePrefix,
      loadedProfile.ast,
      profileSettings,
      superJson.providers,
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

  queryFields['_superJson'] = superJsonFieldConfig(superJson);

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

export function superJsonFieldConfig(
  superJsonDocument?: NormalizedSuperJsonDocument,
): GraphQLFieldConfig<any, any> {
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
      const superJson = superJsonDocument ?? (await loadSuperJson());
      const anonymizedSuperJson = anonymizeSuperJson(superJson);

      return {
        profiles: Object.entries(anonymizedSuperJson.profiles).map(
          ([name, info]) => ({
            name,
            version: info.version,
            providers: info.providers.map((p) => p.provider),
          }),
        ),
        providers: anonymizedSuperJson.providers,
      };
    },
  };
}
