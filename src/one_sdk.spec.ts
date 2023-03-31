jest.mock('@superfaceai/one-sdk');

import { Profile, Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import { GraphQLResolveInfo } from 'graphql';
import {
  createInstance,
  createResolver,
  getInstance,
  perform,
  prepareProviderConfig,
  ResolverArgs,
  ResolverContext,
} from './one_sdk';

const { Ok, Err } = jest.requireActual('@superfaceai/one-sdk');

async function callResolver(
  args: {
    input?: ResolverArgs['input'];
    provider?: ResolverArgs['provider'];
  },
  profile = 'profile',
  useCase = 'UseCase',
  context?: ResolverContext,
) {
  const resolver = createResolver(profile, useCase);
  return await resolver(null, args, context ?? {}, {} as GraphQLResolveInfo);
}

describe('one_sdk', () => {
  let getUseCaseMock: jest.Mock;
  let performMock: jest.Mock;

  beforeEach(() => {
    performMock = jest.fn();

    getUseCaseMock = jest.fn(() => ({
      perform: performMock,
    }));

    jest.mocked(SuperfaceClient.prototype.getProfile).mockResolvedValue({
      getUseCase: getUseCaseMock,
    } as unknown as Profile);

    jest
      .mocked(SuperfaceClient.prototype.getProvider)
      .mockResolvedValue({} as Provider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInstance', () => {
    it('creates SuperfaceClient instance', () => {
      createInstance();
      expect(SuperfaceClient).toBeCalledTimes(1);
    });
  });

  describe('getInstance', () => {
    it('creates SuperfaceClient instance once', () => {
      getInstance();
      getInstance();

      expect(SuperfaceClient).toBeCalledTimes(1);
    });
  });

  describe('perform', () => {
    beforeEach(async () => {
      await perform({
        profile: 'scope/name',
        useCase: 'UseCase',
        provider: 'provider',
        security: { basic: { username: 'user', password: 'pass' } },
        parameters: {
          foo: 'bar',
        },
        input: { input: 'value' },
      });
    });

    it('uses oneSdk instance if passed', async () => {
      const oneSdk = new SuperfaceClient();

      const getProfileSpy = jest.spyOn(oneSdk, 'getProfile');

      await perform({
        profile: 'scope/name',
        useCase: 'UseCase',
        provider: 'provider',
        parameters: {
          foo: 'bar',
        },
        input: { input: 'value' },
        oneSdk,
      });

      expect(getProfileSpy).toBeCalledTimes(1);
    });

    it('calls getProfile with "scope/name"', () => {
      expect(SuperfaceClient.prototype.getProfile).toBeCalledWith('scope/name');
    });

    it('calls getUseCase with "UseCase"', () => {
      expect(getUseCaseMock).toBeCalledWith('UseCase');
    });

    it('calls SuperfaceClient getProvider with "provider"', () => {
      expect(SuperfaceClient.prototype.getProvider).toBeCalledWith('provider');
    });

    it('calls SuperfaceClient perform', () => {
      expect(performMock).toHaveBeenCalledWith(
        { input: 'value' },
        {
          provider: {},
          parameters: { foo: 'bar' },
          security: { basic: { username: 'user', password: 'pass' } },
        },
      );
    });
  });

  describe('prepareProviderConfig', () => {
    it('returns undefined provider if providerArgs is undefined', async () => {
      expect(prepareProviderConfig(undefined, 'profile', 'usecase')).toEqual({
        provider: undefined,
        providerConfig: {},
      });
    });

    it('uses single configured provider without set active to true', async () => {
      expect(
        prepareProviderConfig(
          {
            test: {},
          },
          'profile',
          'usecase',
        ),
      ).toEqual({ provider: 'test', providerConfig: {} });
    });

    it('returns undefined provider if only provider is marked as inactive', async () => {
      expect(
        prepareProviderConfig(
          {
            test: { active: false },
          },
          'profile',
          'usecase',
        ),
      ).toEqual({ provider: undefined, providerConfig: {} });
    });

    it('throws error if more than one provider is marked as active', async () => {
      expect(() =>
        prepareProviderConfig(
          {
            test: { active: true },
            test_two: { active: true },
          },
          'profile',
          'usecase',
        ),
      ).toThrowError();
    });

    it('desanitizes provider name', async () => {
      expect(
        prepareProviderConfig(
          {
            foo__bar_baz: {},
          },
          'profile',
          'usecase',
        ),
      ).toEqual({ provider: 'foo-bar_baz', providerConfig: {} });
    });
  });

  describe('createResolver', () => {
    let resolverResult: any;

    beforeEach(() => {
      performMock.mockResolvedValue(new Ok('perform result'));
    });

    it('sets empty object if input is not set', async () => {
      await callResolver({
        input: undefined,
      });

      expect(performMock.mock.calls[0][0]).toEqual({});
    });

    it('passes `getOneSdkInstance` from context to perform', async () => {
      const getOneSdkInstance = jest.fn(() => new SuperfaceClient());

      await callResolver(
        {
          provider: {
            test: {
              parameters: undefined,
            },
          },
        },
        'profile',
        'UseCase',
        { getOneSdkInstance },
      );

      expect(getOneSdkInstance).toBeCalledTimes(1);
    });

    describe('provider configurations', () => {
      it('passes parameters to perform function', async () => {
        await callResolver({
          provider: {
            test: {
              parameters: { foo: 'bar' },
            },
          },
        });

        expect(performMock.mock.calls[0][1]['parameters']).toEqual({
          foo: 'bar',
        });
      });

      it('passses undefined if parameters are not set', async () => {
        await callResolver({
          provider: {
            test: {
              parameters: undefined,
            },
          },
        });

        expect(performMock.mock.calls[0][1]['parameters']).toBe(undefined);
      });

      it('passes security values to perform function', async () => {
        await callResolver({
          provider: {
            test: {
              security: { foo: { apikey: 'apikey' } },
            },
          },
        });

        expect(performMock.mock.calls[0][1]['security']).toEqual({
          foo: { apikey: 'apikey' },
        });
      });

      it('passses undefined if security are not set', async () => {
        await callResolver({
          provider: {
            test: {
              security: undefined,
            },
          },
        });

        expect(performMock.mock.calls[0][1]['security']).toBe(undefined);
      });
    });

    describe('perform returns Ok result', () => {
      beforeEach(async () => {
        performMock.mockResolvedValue(new Ok('perform result'));

        resolverResult = await callResolver(
          {
            input: { key: 'value' },
            provider: {
              test: { active: true },
            },
          },
          'scope/name',
        );
      });

      it('calls getProfile with "scope/name"', () => {
        expect(SuperfaceClient.prototype.getProfile).toBeCalledWith(
          'scope/name',
        );
      });

      it('calls getUseCase with "UseCase"', () => {
        expect(getUseCaseMock).toBeCalledWith('UseCase');
      });

      it('calls SuperfaceClient getProvider with "test"', () => {
        expect(SuperfaceClient.prototype.getProvider).toBeCalledWith('test');
      });

      it('calls SuperfaceClient perform', () => {
        expect(performMock).toBeCalled();
      });

      it('returns value', () => {
        expect(resolverResult).toEqual({ result: 'perform result' });
      });
    });

    describe('perform returns Error result', () => {
      beforeEach(() => {
        performMock.mockResolvedValue(new Err(new Error('perform error')));
      });

      it('throws error from perform result', async () => {
        await expect(
          callResolver(
            {
              input: { key: 'value' },
            },
            'scope/name',
          ),
        ).rejects.toThrowError();
      });
    });

    describe('perform throws exception', () => {
      beforeEach(() => {
        performMock.mockImplementation(() => {
          throw new Error('failed perform');
        });
      });

      it('re-throws error from perform', async () => {
        await expect(
          callResolver(
            {
              input: { key: 'value' },
            },
            'scope/name',
          ),
        ).rejects.toThrowError();
      });
    });
  });
});
