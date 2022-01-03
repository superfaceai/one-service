import { GraphQLSchema } from 'graphql';
import { generate } from './schema';
import { createSuperJson } from './specHelpers';

describe('schema', () => {
  describe('createSchema', () => {});

  describe('loadSuperJson', () => {});

  describe('generate', () => {
    it('creates schema', async () => {
      await expect(
        generate(createSuperJson('test.supr')),
      ).resolves.toBeInstanceOf(GraphQLSchema);
    });
  });

  describe('profileConfig', () => {});
});
