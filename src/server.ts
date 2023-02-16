import createDebug from 'debug';
import express, { Express } from 'express';
import http from 'http';
import { DEBUG_PREFIX, HOST, PORT } from './constants';
import { renderGraphiQL } from './graphiql';
import { createGraphQLMiddleware } from './graphql';

const debug = createDebug(`${DEBUG_PREFIX}:index`);

export interface Configuration {
  host?: string;
  port?: number;
  graphiql?: boolean;
}

export async function shutdown(httpServer: http.Server): Promise<void> {
  debug('Closing http server.');

  await new Promise((resolve) => {
    httpServer.close(resolve);
  });

  debug('Http server closed.');
  console.log('🌍 Server stopped');

  process.exit(0);
}

export async function bootstrap(config: Configuration): Promise<Express> {
  debug('config', config);

  const app = express();
  const httpServer = http.createServer(app);

  app.use('/graphql', await createGraphQLMiddleware());

  if (config.graphiql) {
    app.get('/', renderGraphiQL);
  }

  const host = config.host ?? HOST;
  const port = config.port ?? PORT;

  await new Promise<void>((resolve) =>
    httpServer.listen({ host, port }, resolve),
  );

  process.on('SIGTERM', async () => {
    debug('SIGTERM signal received.');
    await shutdown(httpServer);
  });

  process.on('SIGINT', async () => {
    debug('SIGINT signal received.');
    await shutdown(httpServer);
  });

  console.log(`🚀 Server ready at http://${host}:${port}`);
  console.log('      GraphQL endpoint /graphql');
  if (config.graphiql) {
    console.log('      GraphiQL endpoint /');
  }

  return app;
}
