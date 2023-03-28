import { NormalizedSuperJsonDocument, ProviderJson } from '@superfaceai/ast';
import {
  fetchProviderInfo,
  resolveProviderJson,
  unknownProviderInfoError,
} from '@superfaceai/one-sdk';
import { load } from './provider';

jest.mock('@superfaceai/one-sdk');

describe('provider', () => {
  const superJson: NormalizedSuperJsonDocument = {
    profiles: {
      'scope/name': {
        version: '1.0.0',
        priority: [],
        defaults: {},
        providers: { provider: { defaults: {} } },
      },
    },
    providers: {
      provider: {
        security: [],
        parameters: {},
      },
    },
  };

  const providerJson: ProviderJson = {
    name: 'provider',
    services: [
      {
        id: 'default',
        baseUrl: 'https://supreface.test',
      },
    ],
    defaultService: 'default',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads provider from local file', async () => {
    jest.mocked(resolveProviderJson).mockResolvedValue(providerJson);
    const result = await load(superJson, 'provider');

    expect(resolveProviderJson).toBeCalled();
    expect(fetchProviderInfo).not.toBeCalled();
    expect(result).toEqual(providerJson);
  });

  it('loads provider from registry', async () => {
    jest.mocked(resolveProviderJson).mockResolvedValue(undefined);
    jest.mocked(fetchProviderInfo).mockResolvedValue(providerJson);
    const result = await load(superJson, 'provider');

    expect(resolveProviderJson).toBeCalled();
    expect(fetchProviderInfo).toBeCalled();
    expect(result).toEqual(providerJson);
  });

  it('throws error if provider not found', async () => {
    jest.mocked(resolveProviderJson).mockResolvedValue(undefined);
    jest.mocked(fetchProviderInfo).mockRejectedValue(
      unknownProviderInfoError({
        message: 'Test error',
        provider: 'provider',
        body: 'dummy',
        statusCode: 404,
      }),
    );

    await expect(load(superJson, 'provider')).rejects.toThrowError();
  });
});
