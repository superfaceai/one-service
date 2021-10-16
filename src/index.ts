import express from 'express';
import createDebug from 'debug';
import { json as parseJson } from 'body-parser';

import { DEBUG_PREFIX, HOST, PORT } from './constants';
import { performRoute } from './perform';

const debug = createDebug(`${DEBUG_PREFIX}:bootstrap`);

export function bootstrap() {
  const app = express();

  app.use(parseJson());

  app.post('/perform', performRoute);

  const host = process.env.HOST ?? HOST;
  const port = parseInt(process.env.PORT ?? '', 10) || PORT;

  app.listen(port, host, () => {
    debug(`Listening on ${host}:${port}`);
  });

  return app;
}
