import { createHandler, HandlerOptions } from 'graphql-http/lib/use/express';
import { Handler } from 'express';
import { createSchema } from './schema';
import { ResolverContext } from './one_sdk';

export type CreateGraphQLServerOptions = HandlerOptions<ResolverContext>;

export async function createGraphQLMiddleware(
  options: CreateGraphQLServerOptions = {},
): Promise<Handler> {
  options.schema = options.schema ?? (await createSchema());

  return createHandler(options);
}
