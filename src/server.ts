import createDebug from 'debug';
import express, { Express } from 'express';
import http from 'http';
import { DEBUG_PREFIX, HOST, PORT } from './constants';
import { renderGraphiQL } from './graphiql';
import { createGraphQLMiddleware } from './graphql';
import { HttpLogger, pinoHttp } from 'pino-http';
import { Level, Logger } from './logger';

const debug = createDebug(`${DEBUG_PREFIX}:server`);

export interface Configuration {
  host?: string;
  port?: number;
  graphiql?: boolean;
  logs?: Level;
}

export async function shutdown(
  httpServer: http.Server,
  httpLogger?: HttpLogger,
): Promise<void> {
  debug('Closing http server.');

  await new Promise((resolve) => {
    httpServer.close(resolve);
  });

  debug('Http server closed.');

  if (httpLogger?.logger) {
    httpLogger?.logger.info('Server stopped');
  } else {
    console.log('🌍 Server stopped');
  }

  process.exit(0);
}

export async function bootstrap(config: Configuration): Promise<Express> {
  debug('config', config);

  const app = express();
  const httpServer = http.createServer(app);
  let httpLogger: HttpLogger | undefined = undefined;

  if (config.logs !== 'silent') {
    httpLogger = pinoHttp({ level: config.logs });
    app.use(httpLogger);
  }

  app.use(
    '/graphql',
    await createGraphQLMiddleware({
      context: { logger: httpLogger?.logger as Logger },
    }),
  );

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
    await shutdown(httpServer, httpLogger);
  });

  process.on('SIGINT', async () => {
    debug('SIGINT signal received.');
    await shutdown(httpServer, httpLogger);
  });

  if (httpLogger?.logger) {
    httpLogger?.logger.info({ port, host }, 'Server ready');
  } else {
    console.log(`🚀 Server ready at http://${host}:${port}`);
    console.log('      GraphQL endpoint /graphql');
    if (config.graphiql) {
      console.log('      GraphiQL endpoint /');
    }
  }

  return app;
}
