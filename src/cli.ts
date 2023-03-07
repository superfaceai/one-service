// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const packageJson = require('../package.json');

import { Command, InvalidOptionArgumentError } from 'commander';
import { bootstrap } from '.';
import { HOST, PORT } from './constants';
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

function validatePort(port: string): number {
  const parsedPort = parseInt(port, 10);

  if (isNaN(parsedPort)) {
    throw new InvalidOptionArgumentError(`'${port}' is not a number.`);
  }

  if (parsedPort < 0 || parsedPort > 65535) {
    throw new InvalidOptionArgumentError(
      `'${port}' should be >= 0 and < 65536`,
    );
  }

  return parsedPort;
}

program
  .option('--graphiql', 'serve GraphQL IDE')
  .option(
    '-l, --logs <level>',
    'turn on logging, level: fatal | error | warn | info | debug | trace | silent',
    validateLogLevel,
    'silent',
  )
  .option('-n, --host <string>', 'the hostname to be used', HOST)
  .option('-p, --port <number>', 'the port to be used', validatePort, PORT)
  .parse();

const opts = program.opts();

bootstrap(opts);
