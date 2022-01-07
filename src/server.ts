import createDebug from 'debug';
import express, { Express } from 'express';
import http from 'http';
import { DEBUG_PREFIX, HOST, PORT } from './constants';
import { createGraphQLMiddleware } from './graphql';

const debug = createDebug(`${DEBUG_PREFIX}:index`);

export interface Configuration {
  host?: string;
  port?: number;
  graphiql?: boolean;
}

export async function bootstrap(config: Configuration): Promise<Express> {
  debug('config', config);

  const app = express();
  const httpServer = http.createServer(app);

  const gqlServer = await createGraphQLMiddleware(config);
  app.use('/graphql', gqlServer);

  const host = config.host ?? HOST;
  const port = config.port ?? PORT;

  await new Promise<void>((resolve) =>
    httpServer.listen({ host, port }, resolve),
  );
  console.log(`🚀 Server ready at http://${host}:${port}`);
  console.log('      GraphQL endpoint /graphql');

  return app;
}
