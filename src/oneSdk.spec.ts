import { createResolver } from './oneSdk';

function callResolver(
  args: { input?: Record<string, any>; options?: { provider?: string } },
  profile = 'weather/current-city',
  useCase = 'GetCurrentWeatherInCity',
) {
  const resolver = createResolver(profile, useCase);
  // @ts-expect-error: Unused GraphQLResolveInfo argument
  return resolver(null, args, null, null);
}

const validWeatherInput = { input: { city: 'Prague, Czechia' } };

describe('oneSdk', () => {
  describe('createResolver', () => {
    it('wraps a use-case into a resolver', async () => {
      await expect(callResolver(validWeatherInput)).resolves.toMatchSnapshot();
    });

    it('throws with invalid input', async () => {
      await expect(
        callResolver({ input: { city: 123 } }),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    describe('with invalid setup', () => {
      it.skip('fails with invalid provider', async () => {
        await expect(
          callResolver({
            options: { provider: 'invalid-provider' },
          }),
        ).rejects.toThrowErrorMatchingSnapshot();
      });

      it('fails with invalid use-case', async () => {
        await expect(
          callResolver({}, 'weather/current-city', 'InvalidUseCase'),
        ).rejects.toThrowErrorMatchingSnapshot();
      });

      it('fails with invalid profile', async () => {
        await expect(
          callResolver({}, 'weather/invalid-profile', 'InvalidUseCase'),
        ).rejects.toThrowErrorMatchingSnapshot();
      });
    });
  });
});
