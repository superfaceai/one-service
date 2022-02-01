import { graphqlHTTP, OptionsData } from 'express-graphql';
import { GraphQLSchema } from 'graphql';
import { IncomingMessage, ServerResponse } from 'http';
import { createSchema } from './schema';

declare type Request = IncomingMessage & {
  url: string;
};
declare type Response = ServerResponse & {
  json?: (data: unknown) => void;
};

export type Middleware = (
  request: Request,
  response: Response,
  next?: (error?: unknown) => void,
) => Promise<void>;

export interface CreateGraphQLServerOptions
  extends Omit<OptionsData, 'schema'> {
  schema?: GraphQLSchema;
}

async function createServerOptions(
  options: CreateGraphQLServerOptions = {},
): Promise<OptionsData> {
  const schema = options.schema ?? (await createSchema());
  const resolvedOptions = { ...options, schema };
  if (!isOptionsData(resolvedOptions)) {
    throw new Error('Property "schema" is missing');
  }

  return resolvedOptions;
}

export function isOptionsData(
  options: CreateGraphQLServerOptions,
): options is OptionsData {
  return options.schema instanceof GraphQLSchema;
}

function throwCallback(err: unknown): void {
  if (err) {
    throw err;
  }
}

export function createGraphQLMiddleware(
  options: CreateGraphQLServerOptions = {},
): Middleware {
  let resolvedMiddleware: Middleware | undefined;

  return async function graphqlMiddleware(req, res, next = throwCallback) {
    if (!resolvedMiddleware) {
      try {
        const resolvedOptions = await createServerOptions(options);
        resolvedMiddleware = graphqlHTTP(resolvedOptions);
      } catch (err) {
        return next(err);
      }
    }
    return resolvedMiddleware(req, res);
  };
}
