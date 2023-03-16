import { generate } from './schema';
import {
  createSuperJson,
  expectSchema,
  expectSchemaValidationErrors,
} from './spec_helpers';

describe('schema', () => {
  describe('generate', () => {
    it('generates valid schema for profile without scope', async () => {
      const schema = await generate(
        await createSuperJson('profile_without_scope'),
      );

      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecases mapped to mutation only', async () => {
      const schema = await generate(await createSuperJson('unsafe_only'));
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });
  });
});
