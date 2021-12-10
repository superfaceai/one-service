import { Provider, SuperfaceClient } from '@superfaceai/one-sdk';

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
