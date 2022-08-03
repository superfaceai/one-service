// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const packageJson = require('../package.json');

export * from './server';
export * from './graphql';
export * from './schema';
export { OneSdkResolverError } from './errors';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
export const VERSION: string = packageJson.version;
