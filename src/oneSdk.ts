import { Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import createDebug from 'debug';
import { GraphQLFieldResolver } from 'graphql';
import { DEBUG_PREFIX } from './constants';

const debug = createDebug(`${DEBUG_PREFIX}:onesdk`);
let instance: SuperfaceClient;

export interface PerformParams {
  profile: string;
  useCase: string;
  provider?: string;
  input: Record<string, any>;
}

export function createInstance() {
  return new SuperfaceClient();
}

export function getInstance(): SuperfaceClient {
  if (!instance) {
    instance = createInstance();
  }

  return instance;
}

export async function perform(params: PerformParams) {
  const oneSdk = getInstance();

  const profile = await oneSdk.getProfile(params.profile);
  const useCase = profile.getUseCase(params.useCase); // Why this doesn't throw if getProfile does?
  let provider!: Provider;

  if (params.provider) {
    provider = await oneSdk.getProvider(params.provider);
  }

  return await useCase.perform(params.input, { provider });
}

export function createResolver(
  profile: string,
  useCase: string,
): GraphQLFieldResolver<any, any> {
  debug(`Creating resolver for ${profile}/${useCase}`);

  return async function (source: any, args: any): Promise<any> {
    debug(`Performing ${profile}/${useCase}`, { source, args });

    // TODO exception
    const result = await perform({
      profile,
      useCase,
      input: args?.input,
      provider: args?.options?.provider,
    });

    debug('Perform result', result);

    if (result.isOk()) {
      return {
        result: result.value,
      };
    } else {
      throw result.error;
    }
  };
}
