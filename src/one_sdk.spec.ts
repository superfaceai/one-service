jest.mock('@superfaceai/one-sdk');

import { Profile, Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import { GraphQLResolveInfo } from 'graphql';
import {
  createInstance,
  createResolver,
  getInstance,
  perform,
  ResolverContext,
} from './one_sdk';

const { Ok, Err } = jest.requireActual('@superfaceai/one-sdk');

async function callResolver(
  args: {
    input?: Record<string, any>;
    options?: { provider?: string; parameters?: Record<string, string> };
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
        },
      );
    });
  });

  describe('createResolver', () => {
    let resolverResult: any;

    it('sets empty object if input is not set', async () => {
      performMock.mockResolvedValue(new Ok('perform result'));
      await callResolver({
        input: undefined,
      });

      expect(performMock.mock.calls[0][0]).toEqual({});
    });

    it('sets empty object if parameters are not set', async () => {
      performMock.mockResolvedValue(new Ok('perform result'));
      await callResolver({
        options: {
          parameters: undefined,
        },
      });

      expect(performMock.mock.calls[0][1]['parameters']).toEqual({});
    });

    it('passes `getOneSdkInstance` from context to perform', async () => {
      const getOneSdkInstance = jest.fn(() => new SuperfaceClient());
      performMock.mockResolvedValue(new Ok('perform result'));
      await callResolver(
        {
          options: {
            parameters: undefined,
          },
        },
        'profile',
        'UseCase',
        { getOneSdkInstance },
      );

      expect(getOneSdkInstance).toBeCalledTimes(1);
    });

    describe('perform returns Ok result', () => {
      beforeEach(async () => {
        performMock.mockResolvedValue(new Ok('perform result'));

        resolverResult = await callResolver(
          {
            input: { key: 'value' },
            options: {
              provider: 'provider',
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

      it('calls SuperfaceClient getProvider with "provider"', () => {
        expect(SuperfaceClient.prototype.getProvider).toBeCalledWith(
          'provider',
        );
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
              options: {
                provider: 'provider',
              },
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
              options: {
                provider: 'provider',
              },
            },
            'scope/name',
          ),
        ).rejects.toThrowError();
      });
    });
  });
});
