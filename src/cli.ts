// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const packageJson = require('../package.json');

import { Command, InvalidOptionArgumentError } from 'commander';
import { bootstrap } from '.';
import { Level } from './logger';

const program = new Command();
program.version(packageJson.version);

function validateLogLevel(level: string): Level | undefined {
  if (
    !['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(
      level,
    )
  ) {
    throw new InvalidOptionArgumentError(`'${level}' is unknown log level.`);
  }

  return level as Level;
}

program
  .option('--graphiql', 'serve GraphQL IDE')
  .option(
    '-l, --logs <level>',
    'turn on logging, level: fatal | error | warn | info | debug | trace | silent',
    validateLogLevel,
    'silent',
  )
  .option('-n, --host <string>', 'the hostname to be used', 'localhost')
  .option('-p, --port <number>', 'the port to be used', parseInt, 8000)
  .parse();

const opts = program.opts();

bootstrap(opts);
