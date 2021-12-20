import { GraphQLSchema } from 'graphql';
import { generate } from './schema';
import { createSuperJson } from './specHelpers';

describe('schema', () => {
  describe('createSchema', () => {});

  describe('generate', () => {
    it('creates schema', async () => {
      const schema = generate(createSuperJson('test.supr'));

      await expect(schema).resolves.toBeInstanceOf(GraphQLSchema);
    });
  });

  describe('loadProfile', () => {});

  describe('capitalize', () => {});

  describe('camelize', () => {});
});
