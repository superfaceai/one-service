import { generate } from './schema';
import { createSuperJson, expectSchemaValidationErrors } from './spec_helpers';

describe('schema', () => {
  describe('createSchema', () => {});

  describe('loadSuperJson', () => {});

  describe('generate', () => {
    it('generates valid schema for profile without scope', async () => {
      expectSchemaValidationErrors(
        await generate(await createSuperJson('profile_without_scope')),
      );
    });

    it('generates valid schema for usecases mapped to mutation only', async () => {
      expectSchemaValidationErrors(
        await generate(await createSuperJson('unsafe_only')),
      );
    });
  });

  describe('profileConfig', () => {});
});
