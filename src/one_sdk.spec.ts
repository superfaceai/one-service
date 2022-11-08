jest.mock('@superfaceai/one-sdk');

import { Profile, Provider, SuperfaceClient } from '@superfaceai/one-sdk';
import {
  createInstance,
  createResolver,
  getInstance,
  perform,
} from './one_sdk';

const { Ok, Err } = jest.requireActual('@superfaceai/one-sdk');

async function callResolver(
  args: { input?: Record<string, any>; options?: { provider?: string } },
  profile = 'profile',
  useCase = 'UseCase',
) {
  const resolver = createResolver(profile, useCase);
  // @ts-expect-error: Unused GraphQLResolveInfo argument
  return await resolver(null, args, null, null);
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
