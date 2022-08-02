import { Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import createDebug from 'debug';
import { GraphQLFieldResolver } from 'graphql';
import { DEBUG_PREFIX } from './constants';
import { isOneSdkError, OneSdkError, remapOneSdkError } from './errors';

const debug = createDebug(`${DEBUG_PREFIX}:onesdk`);
let instance: SuperfaceClient;

export interface PerformParams {
  profile: string;
  useCase: string;
  provider?: string;
  parameters?: Record<string, string>;
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
  const useCase = profile.getUseCase(params.useCase);
  let provider!: Provider;

  if (params.provider) {
    provider = await oneSdk.getProvider(params.provider);
  }

  return await useCase.perform(params.input, {
    provider,
    parameters: params.parameters,
  });
}

export function createResolver(
  profile: string,
  useCase: string,
): GraphQLFieldResolver<any, any> {
  debug(`Creating resolver for ${profile}/${useCase}`);

  return async function oneSdkResolver(source: any, args: any): Promise<any> {
    debug(`Performing ${profile}/${useCase}`, { source, args });

    try {
      const result = await perform({
        profile,
        useCase,
        input: args?.input,
        provider: args?.options?.provider,
        parameters: args?.options?.parameters,
      });

      debug('Perform result', result);

      if (result.isOk()) {
        return {
          result: result.value,
        };
      } else {
        throw result.error;
      }
    } catch (err) {
      debug('Perform exception', err);
      // This is needed because OneSDK v1.x throws errors which don't inherit from Error,
      // causing graphql-js to throw the original error away.
      // While we do mapping, we can also extract SDK-specific properties to GraphQL extensions
      if (isOneSdkError(err)) {
        throw remapOneSdkError(err);
      }
      throw err;
    }
  };
}
