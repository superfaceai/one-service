import express, { Express } from 'express';
import http from 'http';
import { HOST, PORT } from './constants';
import { createGraphQLServer } from './graphql';

export interface Configuration {
  enableCors: boolean;
}

export async function bootstrap(): Promise<Express> {
  const app = express();
  const httpServer = http.createServer(app);

  const gqlServer = await createGraphQLServer();
  app.use('/graphql', gqlServer);

  const host = process.env.HOST ?? HOST;
  const port = parseInt(process.env.PORT ?? '', 10) || PORT;

  await new Promise<void>((resolve) =>
    httpServer.listen({ host, port }, resolve),
  );
  console.log(`🚀 Server ready at http://${host}:${port}`);
  console.log('      GraphQL endpoint /graphql');

  return app;
}
