import { createGraphQLMiddleware } from './graphql';
import { getMockReq, getMockRes } from '@jest-mock/express';
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
      it('returns a middleware with generated schema', () => {
        const middleware = createGraphQLMiddleware();
        expect(middleware).toEqual(expect.any(Function));
        expect(createSchema).toHaveBeenCalled();
      });

      describe('with createSchema error', () => {
        beforeEach(() => {
          mocked(createSchema).mockRejectedValueOnce(
            new Error('Unable to generate, super.json not found'),
          );
        });

        it('passes initialization error to next', async () => {
          const middleware = createGraphQLMiddleware();

          const req = getMockReq();
          const { res, next } = getMockRes();

          await expect(middleware(req, res, next)).resolves.not.toThrow();
          expect(next).toBeCalled();
        });

        it('throws when next is missing', async () => {
          const middleware = createGraphQLMiddleware();

          const req = getMockReq();
          const { res } = getMockRes();

          await expect(
            middleware(req, res),
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Unable to generate, super.json not found"`,
          );
        });
      });
    });

    describe('with invalid schema', () => {
      it('throws an error', async () => {
        const req = getMockReq();
        const { res } = getMockRes();
        // @ts-expect-error Intentional error
        const middleware = createGraphQLMiddleware({ schema: true });
        await expect(
          middleware(req, res),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Property \\"schema\\" is missing"`,
        );
      });
    });
  });
});
