import { graphqlHTTP } from 'express-graphql';
import { IncomingMessage, ServerResponse } from 'http';
import { GraphiQLOptions } from 'express-graphql/renderGraphiQL';
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
) => Promise<void>;

export type CreateGrapgQLServerOptions = {
  graphiql?: boolean | GraphiQLOptions;
};

export async function createGraphQLServer(
  options: CreateGrapgQLServerOptions = {},
): Promise<Middleware> {
  return graphqlHTTP({
    graphiql: options.graphiql ?? true,
    schema: await createSchema(),
  });
}
