// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const packageJson = require('../package.json');

import { Command } from 'commander';
import { bootstrap } from '.';

const program = new Command();
program.version(packageJson.version);

program
  .option(
    '-n, --host <string>',
    'the hostname to be used. Defaults to `localhost`',
  )
  .option(
    '-p, --port <number>',
    'the port to be used. Defaults to 8000',
    parseInt,
  )
  .option('--graphiql', 'Allow graphical interactive in-browser GraphQL IDE')
  .parse();

const opts = program.opts();

bootstrap(opts);
