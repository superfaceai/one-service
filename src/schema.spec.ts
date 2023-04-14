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
        await createSuperJson(['profile_without_scope']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecases mapped to mutation only', async () => {
      const schema = await generate(await createSuperJson(['unsafe_only']));
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for profile with mutiple usecases', async () => {
      const schema = await generate(
        await createSuperJson(['profile_multiple_use_cases']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecase with empty input', async () => {
      const schema = await generate(
        await createSuperJson(['profile_with_empty_input_structure']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecase with empty nested object in input', async () => {
      const schema = await generate(
        await createSuperJson(['profile_with_empty_nested_object_in_input']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecase with empty result', async () => {
      const schema = await generate(
        await createSuperJson(['profile_with_empty_result']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecase with empty nested object in result', async () => {
      const schema = await generate(
        await createSuperJson(['profile_with_empty_nested_object_in_result']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for usecase without result', async () => {
      const schema = await generate(await createSuperJson(['no_result']));
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });

    it('generates valid schema for two profiles with same provider', async () => {
      const schema = await generate(
        await createSuperJson(['safe_only', 'unsafe_only']),
      );
      expectSchemaValidationErrors(schema);
      expectSchema(schema);
    });
  });
});
