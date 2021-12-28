import { graphqlHTTP, OptionsData } from 'express-graphql';
import { IncomingMessage, ServerResponse } from 'http';
import { createSchema } from './schema';
import { GraphQLSchema } from 'graphql';
import { assertMapDocumentNode } from '@superfaceai/ast';

declare type Request = IncomingMessage & {
  url: string;
};
declare type Response = ServerResponse & {
  json?: (data: unknown) => void;
};

export type Middleware = (
  request: Request,
  response: Response,
) => Promise<void>;

export interface CreateGraphQLServerOptions
  extends Omit<OptionsData, 'schema'> {
  schema?: GraphQLSchema;
}

export async function createGraphQLMiddleware(
  options: CreateGraphQLServerOptions = {},
): Promise<Middleware> {
  options.schema = options.schema ?? (await createSchema());

  if (!isOptionsData(options)) {
    throw new Error('Property "schema" is missing');
  }

  return graphqlHTTP(options);
}

export function isOptionsData(
  options: CreateGraphQLServerOptions,
): options is OptionsData {
  return options.schema instanceof GraphQLSchema;
}
