import { GraphQLString } from 'graphql';
import {
  camelize,
  capitalize,
  description,
  hasFieldsDefined,
  pascalize,
  sanitize,
  sanitizedProfileName,
  typeFromSafety,
} from './schema.utils';

describe('schema.utils', () => {
  describe('sanitize', () => {
    it('replaces all "/" with "_" ', () => {
      expect(sanitize('test/test/test')).toBe('test_test_test');
    });

    it('replaces all "-" with "_"', () => {
      expect(sanitize('test-test-test')).toBe('test_test_test');
    });
  });

  describe('capitalize', () => {
    it('makes first latter uppercase', () => {
      expect(capitalize('test')).toBe('Test');
    });
  });

  describe('camelize', () => {
    it('camelize dash-cased string', () => {
      expect(camelize('test-test-test')).toBe('testTestTest');
    });

    it('camelize snake_cased string', () => {
      expect(camelize('test_test_test')).toBe('testTestTest');
    });
  });

  describe('pascalize', () => {
    it('pascalize dash-cased string', () => {
      expect(pascalize('test-test-test')).toBe('TestTestTest');
    });

    it('pascalize snake_cased string', () => {
      expect(pascalize('test_test_test')).toBe('TestTestTest');
    });
  });

  describe('sanitizedProfileName', () => {
    it('returns pascalized profile', () => {
      expect(
        sanitizedProfileName({
          header: {
            kind: 'ProfileHeader',
            name: 'profile-name',
            scope: 'scope-name',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
            },
          },
          definitions: [],
          astMetadata: {
            astVersion: {
              major: 1,
              minor: 0,
              patch: 0,
            },
            parserVersion: {
              major: 1,
              minor: 0,
              patch: 0,
            },
            sourceChecksum: 'checksum',
          },
          kind: 'ProfileDocument',
        }),
      ).toBe('ScopeNameProfileName');
    });
  });

  describe('description', () => {
    it('returns title only', () => {
      expect(
        description({
          title: 'title',
        }),
      ).toBe('title');
    });

    it('returns title and desciption with new line', () => {
      expect(
        description({
          title: 'title',
          description: 'description',
        }),
      ).toBe('title\ndescription');
    });
  });

  describe('typeFromSafety', () => {
    it('returns "query" for "safe" operation', () => {
      expect(typeFromSafety('safe')).toBe('query');
    });

    it('returns "mutation" for "unsafe" operation', () => {
      expect(typeFromSafety('unsafe')).toBe('mutation');
    });

    it('returns "mutation" for "idempotent" operation', () => {
      expect(typeFromSafety('idempotent')).toBe('mutation');
    });

    it('returns "mutation" for unspecified safety', () => {
      expect(typeFromSafety()).toBe('mutation');
    });
  });

  describe('hasFieldsDefined', () => {
    it('returns "false" for empty configuration object', () => {
      expect(hasFieldsDefined({})).toBeFalsy();
    });

    it('returns true for configuration with one field', () => {
      expect(
        hasFieldsDefined({
          field: { type: GraphQLString },
        }),
      ).toBeTruthy();
    });
  });
});
