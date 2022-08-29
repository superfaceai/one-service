import { NormalizedSuperJsonDocument } from '@superfaceai/ast';
import { load } from './profile';
import { resolveProfileAst } from '@superfaceai/one-sdk';

jest.mock('@superfaceai/one-sdk');

describe('profile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const superJson: NormalizedSuperJsonDocument = {
    profiles: {
      'scope/name': {
        version: '1.0.0',
        priority: [],
        defaults: {},
        providers: { provider: { defaults: {} } },
      },
    },
    providers: {},
  };

  describe('load', () => {
    it('calls resolveProfileAst', async () => {
      await load(superJson, 'scope/name');
      expect(resolveProfileAst).toBeCalledWith({
        profileId: 'scope/name',
        version: '1.0.0',
        superJson: expect.anything(),
        config: expect.anything(),
        crypto: expect.anything(),
        fetchInstance: expect.anything(),
        fileSystem: expect.anything(),
      });
    });
  });
});
