import { GraphQLSchema } from 'graphql';
import { generate } from './schema';
import { createSuperJson } from './spec_helpers';

describe('schema', () => {
  describe('createSchema', () => {});

  describe('loadSuperJson', () => {});

  describe('generate', () => {
    it('creates schema', async () => {
      await expect(
        generate(await createSuperJson('test')),
      ).resolves.toBeInstanceOf(GraphQLSchema);
    });
  });

  describe('profileConfig', () => {});
});
