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
  ArgumentNode,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  print,
  printSchema,
  SelectionNode,
  SelectionSetNode,
} from 'graphql';
import { join as joinPath } from 'path';
import { DEBUG_PREFIX } from './constants';
import { load as loadProfile } from './profile';
import { generateProfileConfig, generateProfileTypes } from './schema.types';
import {
  hasFieldsDefined,
  sanitizedProfileName,
  typeFromSafety,
} from './schema.utils';
import {
  getProfileOutput,
  ObjectStructure,
  StructureType,
} from '@superfaceai/parser';

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

function selectionSet(selections: SelectionNode[]): SelectionSetNode {
  return {
    kind: Kind.SELECTION_SET,
    selections,
  };
}

function fieldSelection(
  name: string,
  subFields?: SelectionNode[],
  args?: ArgumentNode[],
): SelectionNode {
  return {
    kind: Kind.FIELD,
    name: {
      kind: Kind.NAME,
      value: name,
    },
    selectionSet: subFields ? selectionSet(subFields) : undefined,
    arguments: args,
  };
}

function isNested(structure: StructureType): boolean {
  return (
    structure.kind === 'ListStructure' ||
    structure.kind === 'ObjectStructure' ||
    structure.kind === 'NonNullStructure'
  );
}

function resultFields(structure: StructureType): SelectionNode[] {
  if (structure.kind === 'NonNullStructure') {
    return resultFields(structure.value);
  }

  if (structure.kind === 'ObjectStructure') {
    return Object.entries(structure.fields ?? {}).map(
      ([fieldName, fieldStructure]) => {
        return fieldSelection(
          fieldName,
          isNested(fieldStructure) ? resultFields(fieldStructure) : undefined,
        );
      },
    );
  }

  if (structure.kind === 'ListStructure') {
    return resultFields(structure.value);
  }

  return [];
}

function inputArgument(structure: ObjectStructure): ArgumentNode[] {
  return [
    {
      kind: Kind.ARGUMENT,
      name: {
        kind: Kind.NAME,
        value: 'input',
      },
      value: {
        kind: Kind.OBJECT,
        fields: Object.entries(structure.fields).map(([fieldName]) => {
          return {
            kind: Kind.OBJECT_FIELD,
            name: {
              kind: Kind.NAME,
              value: fieldName,
            },
            value: {
              kind: Kind.STRING,
              value: '',
            },
          };
        }),
      },
    },
  ];
}

export async function generateOperationExample(
  superJson: NormalizedSuperJsonDocument,
  profileId: string,
): Promise<string | undefined> {
  const profile = await loadProfile(superJson, profileId);

  const profileOutput = getProfileOutput(profile.ast);
  const usecase = profileOutput.usecases[0];

  if (!usecase) {
    console.error('no usecase');
    return;
  }

  const operation: OperationDefinitionNode = {
    kind: Kind.OPERATION_DEFINITION,
    operation:
      typeFromSafety(usecase.safety) === 'query'
        ? OperationTypeNode.QUERY
        : OperationTypeNode.MUTATION,
    name: {
      kind: Kind.NAME,
      value: 'Example',
    },
    selectionSet: selectionSet([
      fieldSelection(sanitizedProfileName(profile.ast), [
        fieldSelection(
          usecase.useCaseName,
          [
            fieldSelection(
              'result',
              usecase.result ? resultFields(usecase.result) : undefined,
            ),
          ],
          [...(usecase.input ? inputArgument(usecase.input) : [])],
        ),
      ]),
    ]),
  };

  return print(operation);
}
