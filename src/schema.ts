import {
  GraphQLEnumType,
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { perform } from './oneSdk';
import { DEBUG_PREFIX } from './constants';
import createDebug from 'debug';

const debug = createDebug(`${DEBUG_PREFIX}:schema`);

// Attempt to do https://graphql.org/blog/rest-api-graphql-wrapper/ with Superface Profiles and OneSDK
// Working with arrays: https://atheros.ai/blog/graphql-list-how-to-use-arrays-in-graphql-schema

export function createResolver(
  profile: string,
  useCase: string,
): GraphQLFieldResolver<any, any> {
  debug(`Crating resolver for ${profile}/${useCase}`);

  return async function (
    source: any,
    args: any,
    context: any,
    info: any,
  ): Promise<any> {
    debug(`Performing ${profile}/${useCase}`, { source, args });

    // TODO exception
    const result = await perform({
      profile,
      useCase,
      input: args?.input,
      provider: args?.options?.provider,
    });

    debug('Perform result', result);

    if (result.isOk()) {
      // Following lines should be properly thought through and depends on decision
      // how generated schema will look like.

      const value = result.value;

      if (Array.isArray(value)) {
        return {
          edges: value,
        };
      }

      if (typeof value === 'object' && value !== null) {
        return value;
      }

      return {
        node: value,
      };
    } else {
      throw result.error;
    }
  };
}

export async function createSchema(): Promise<GraphQLSchema> {
  // This function should generate schema from Superface Profiles

  const UseCaseOptionsType = new GraphQLInputObjectType({
    name: 'UseCaseOptions',
    fields: {
      provider: {
        type: GraphQLString,
        description: 'Specify what provider to use',
      },
    },
  });

  const CrmContactsSearchInputOperatorEnum = new GraphQLEnumType({
    name: 'CrmContactsSearchInputOperatorEnum',
    values: {
      EQ: { value: 'EQ' },
      NEQ: { value: 'NEQ' },
    },
  });

  const CrmContactsSearchInput = new GraphQLInputObjectType({
    name: 'CrmContactsSearchInput',
    fields: () => ({
      property: {
        type: GraphQLNonNull(GraphQLString),
        description: `
          Property
          Property name to compare value with
        `,
      },
      operator: {
        type: CrmContactsSearchInputOperatorEnum,
        description: `
          Operator
          Comparison operation
        `,
      },
      value: {
        type: GraphQLNonNull(GraphQLString),
        description: `
          Value
          Value to compare against values in property
        `,
      },
    }),
  });

  const CrmContactsSearchResultNodeType = new GraphQLObjectType({
    name: 'CrmContactsSearchResultNode',
    fields: () => ({
      id: {
        type: GraphQLString,
      },
      email: {
        type: GraphQLString,
      },
      phone: {
        type: GraphQLString,
      },
      firstName: {
        type: GraphQLString,
      },
      lastName: {
        type: GraphQLString,
      },
      company: {
        type: GraphQLString,
      },
      country: {
        type: GraphQLString,
      },
      customProperties: {
        type: GraphQLString,
      },
    }),
  });

  const CrmContactsSearchResultType = new GraphQLObjectType({
    name: 'CrmContactsSearchResult',
    fields: {
      edges: {
        type: GraphQLList(CrmContactsSearchResultNodeType),
      },
    },
  });

  const CrmContactsQueryType = new GraphQLObjectType({
    name: 'CrmContactsQuery',
    fields: {
      Search: {
        type: CrmContactsSearchResultType,
        args: {
          input: {
            type: CrmContactsSearchInput,
          },
          options: {
            type: UseCaseOptionsType,
          },
        },
        resolve: createResolver('crm/contacts', 'Search'),
      },
    },
  });

  const CrmContactsMutationType = new GraphQLObjectType({
    name: 'CrmContactsMutation',
    fields: () => ({
      Create: {
        type: GraphQLString,
        description: 'Not implemented',
      },
      Update: {
        type: GraphQLString,
        description: 'Not implemented',
      },
    }),
  });

  const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
      CrmContacts: {
        type: CrmContactsQueryType,
        // hack if nonscalar value is returned execution will continue towards leaves (our use-case) https://graphql.org/learn/execution/
        resolve: () => ({ profile: 'crm/contacts' }),
      },
    },
  });

  const MutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      CrmContacts: {
        type: CrmContactsMutationType,
      },
    },
  });

  return new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
  });
}
