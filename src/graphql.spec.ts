import { createGraphQLMiddleware } from './graphql';
import { createSchema } from './schema';
import { mocked } from 'jest-mock';
import { GraphQLSchema } from 'graphql';

jest.mock('./schema');

describe('graphql', () => {
  beforeEach(() => {
    mocked(createSchema).mockResolvedValue(new GraphQLSchema({}));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createGraphQLMiddleware', () => {
    describe('with no options', () => {
      it('returns a middleware with generated schema', async () => {
        await expect(createGraphQLMiddleware()).resolves.toEqual(expect.any(Function));
        expect(createSchema).toHaveBeenCalled();
      });

      describe('with createSchema error', () => {
        beforeEach(() => {
          mocked(createSchema).mockRejectedValueOnce(
            new Error('Unable to generate, super.json not found'),
          );
        });

        it('throws upon initialization', async () => {
          expect(createGraphQLMiddleware()).rejects.toThrowError();
        });
      });
    });

    describe('with invalid schema', () => {
      it('throws an error', async () => {
        // @ts-expect-error Intentional error
        const middleware = createGraphQLMiddleware({ schema: true });
        await expect(middleware).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Property \\"schema\\" is missing"`,
        );
      });
    });
  });
});
