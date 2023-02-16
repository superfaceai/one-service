import { createGraphQLMiddleware } from './graphql';
import { createSchema } from './schema';
import { GraphQLSchema } from 'graphql';

jest.mock('./schema');

describe('graphql', () => {
  beforeEach(() => {
    jest.mocked(createSchema).mockResolvedValue(new GraphQLSchema({}));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createGraphQLMiddleware', () => {
    describe('with no options', () => {
      it('returns a middleware with generated schema', async () => {
        await expect(createGraphQLMiddleware()).resolves.toEqual(
          expect.any(Function),
        );
        expect(createSchema).toHaveBeenCalled();
      });

      describe('with createSchema error', () => {
        beforeEach(() => {
          jest
            .mocked(createSchema)
            .mockRejectedValueOnce(
              new Error('Unable to generate, super.json not found'),
            );
        });

        it('throws upon initialization', async () => {
          await expect(createGraphQLMiddleware()).rejects.toThrowError();
        });
      });
    });
  });
});
