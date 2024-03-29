import { SecurityValues } from '@superfaceai/ast';
import { Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import createDebug from 'debug';
import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { DEBUG_PREFIX } from './constants';
import { isOneSdkError, remapOneSdkError } from './errors';
import { Logger } from './logger';
import { desanitizeForFieldName } from './schema.utils';

const debug = createDebug(`${DEBUG_PREFIX}:onesdk`);
let instance: SuperfaceClient;

export type PerformParams = {
  profile: string;
  useCase: string;
  input?: Record<string, any>;
  provider?: string;
  parameters?: Record<string, string>;
  security?: Record<string, Omit<SecurityValues, 'id'>>;
  oneSdk?: SuperfaceClient;
};

export type ResolverContext = {
  logger?: Logger;
  getOneSdkInstance?: () => SuperfaceClient;
};

export type ProviderConfig = {
  parameters?: PerformParams['parameters'];
  security?: PerformParams['security'];
  active?: boolean;
};
export type ResolverArgs = {
  input?: PerformParams['input'];
  provider?: Record<NonNullable<PerformParams['provider']>, ProviderConfig>;
};

export type ResolverResult<TResult> = {
  result: TResult;
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
  debug('Performing with params', params);

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
    security: params.security,
  });
}

export function prepareProviderConfig(
  providerArg: ResolverArgs['provider'],
  profile: string,
  useCase: string,
): {
  provider: PerformParams['provider'];
  providerConfig: ProviderConfig;
} {
  if (providerArg === undefined) {
    return {
      provider: undefined,
      providerConfig: {},
    };
  }

  const activeProviders = [];
  const configuredProviders = Object.keys(providerArg);

  if (configuredProviders.length === 1) {
    if (providerArg[configuredProviders[0]].active !== false) {
      activeProviders.push(configuredProviders[0]);
    }
  } else {
    for (const [providerName, providerConfig] of Object.entries(providerArg)) {
      if (providerConfig.active) {
        activeProviders.push(providerName);
      }
    }

    if (activeProviders.length > 1) {
      throw new Error(
        `Multiple providers are active for ${profile}/${useCase}: ${activeProviders.join(
          ', ',
        )}. Please choose a single active provider`,
      );
    }
  }

  const provider = activeProviders[0];

  if (!provider) {
    return {
      provider: undefined,
      providerConfig: {},
    };
  }

  return {
    provider: desanitizeForFieldName(provider),
    providerConfig: providerArg[provider] ?? {},
  };
}

export function prepareSecurity(
  security?: ProviderConfig['security'],
): ProviderConfig['security'] {
  if (security === undefined) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(security).map(([key, value]) => {
      return [desanitizeForFieldName(key), value];
    }),
  );
}

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

    const { provider, providerConfig } = prepareProviderConfig(
      args.provider,
      profile,
      useCase,
    );

    const security = prepareSecurity(providerConfig.security);

    try {
      const result = await perform({
        profile,
        useCase,
        provider,
        input: args.input ?? {},
        parameters: providerConfig.parameters,
        security,
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
