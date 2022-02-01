import { createGraphQLMiddleware, Middleware } from './graphql';
import { getMockReq, getMockRes } from '@jest-mock/express';

describe('graphql', () => {
  describe('createGraphQLMiddleware', () => {
    describe('with no options', () => {
      let middleware: Middleware;
      beforeEach(() => {
        middleware = createGraphQLMiddleware();
      });
      it('returns a middleware with generated schema', () => {
        expect(middleware).toEqual(expect.any(Function));
      });

      it('passes initialization error to next', async () => {
        const req = getMockReq();
        const { res, next } = getMockRes();

        await expect(middleware(req, res, next)).resolves.not.toThrow();
        expect(next).toBeCalled();
      });

      it('throws when next is missing', async () => {
        const req = getMockReq();
        const { res } = getMockRes();

        await expect(
          middleware(req, res),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Unable to generate, super.json not found"`,
        );
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
