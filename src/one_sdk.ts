import { Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import createDebug from 'debug';
import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { DEBUG_PREFIX } from './constants';
import { isOneSdkError, remapOneSdkError } from './errors';
import { Logger } from './logger';

const debug = createDebug(`${DEBUG_PREFIX}:onesdk`);
let instance: SuperfaceClient;

export type PerformParams = {
  profile: string;
  useCase: string;
  input: Record<string, any>;
  provider?: string;
  parameters?: Record<string, string>;
  oneSdk?: SuperfaceClient;
};

export function createInstance() {
  return new SuperfaceClient();
}

export function getInstance() {
  if (!instance) {
    instance = createInstance();
  }

  return instance;
}

export async function perform(params: PerformParams) {
  const oneSdk = params.oneSdk ?? getInstance();

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

export type ResolverContext = {
  logger?: Logger;
  getOneSdkInstance?: () => SuperfaceClient;
};
export type ResolverArgs = {
  input?: PerformParams['input'];
  options?: {
    provider?: PerformParams['provider'];
    parameters?: PerformParams['parameters'];
  };
};
export type ResolverResult<TResult> = {
  result: TResult;
};

export function createResolver<
  TSource,
  TContext extends ResolverContext,
  TArgs extends ResolverArgs,
  TResult = unknown,
>(
  profile: string,
  useCase: string,
): GraphQLFieldResolver<
  TSource,
  TContext,
  TArgs,
  Promise<ResolverResult<TResult>>
> {
  debug(`Creating resolver for ${profile}/${useCase}`);

  return async function oneSdkResolver(
    source: TSource,
    args: TArgs,
    context: TContext | undefined,
    info: GraphQLResolveInfo,
  ): Promise<ResolverResult<TResult>> {
    debug(`Performing ${profile}/${useCase}`, { source, args, context, info });

    try {
      const result = await perform({
        profile,
        useCase,
        input: args.input ?? {},
        provider: args.options?.provider,
        parameters: args.options?.parameters ?? {},
        oneSdk: context?.getOneSdkInstance?.(),
      });

      debug('Perform result', result);

      if (result.isOk()) {
        context?.logger?.info(result.value, 'Perform result');
        return {
          result: result.value as TResult,
        };
      } else {
        throw result.error;
      }
    } catch (err) {
      debug('Perform exception', err);
      context?.logger?.error(err, 'Perform exception');

      // This is needed because OneSDK throws errors which don't inherit from Error,
      // causing graphql-js to throw the original error away.
      // While we do mapping, we can also extract SDK-specific properties to GraphQL extensions
      if (isOneSdkError(err)) {
        throw remapOneSdkError(err);
      }
      throw err;
    }
  };
}
