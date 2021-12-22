import { ObjectStructure } from '@superfaceai/parser';
import {
  camelize,
  capitalize,
  description,
  enumType,
  outputType,
  pascalize,
  sanitize,
  sanitizedProfileName,
  scalarType,
} from './schema.utils';
import { expectSchema } from './specHelpers';

const objectStructure: ObjectStructure = {
  kind: 'ObjectStructure',
  title: 'Object title',
  description: 'Object description',
  fields: {
    primitive_string: {
      kind: 'PrimitiveStructure',
      type: 'string',
      title: 'Primitive',
      description: 'String',
    },
    primitive_number: {
      kind: 'PrimitiveStructure',
      type: 'number',
      title: 'Primitive',
      description: 'Number',
    },
    primitive_boolean: {
      kind: 'PrimitiveStructure',
      type: 'boolean',
      title: 'Primitive',
      description: 'boolean',
    },
    nested_object: {
      kind: 'ObjectStructure',
      title: 'Object',
      description: 'Nested',
      fields: {
        field: {
          kind: 'PrimitiveStructure',
          type: 'string',
          title: 'Nested field title',
          description: 'Nested field description',
        },
      },
    },
    list: {
      kind: 'ListStructure',
      value: {
        kind: 'NonNullStructure',
        value: {
          kind: 'PrimitiveStructure',
          type: 'string',
          title: 'List item title',
          description: 'List item description',
        },
      },
    },
    enum: {
      kind: 'EnumStructure',
      enums: [{ value: 'one' }, { value: 'two' }],
      title: 'Enum title',
      description: 'Enum description',
    },
  },
};

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

  describe('scalarType', () => {
    it('returns GraphQLScalarType', () => {
      expectSchema(
        scalarType('TestScalar', {
          kind: 'ScalarStructure',
          title: 'Scalar title',
          description: 'Scalar description',
        }),
      );
    });
  });

  describe('enumType', () => {
    it('returns GraphQLEnumType', () => {
      expectSchema(
        enumType('TestEnum', {
          kind: 'EnumStructure',
          enums: [{ value: 'ONE' }, { value: 'TWO' }],
          title: 'Enum title',
          description: 'Enum description',
        }),
      );
    });
  });

  describe('outputType', () => {
    it('returns GraphQLObjectType', () => {
      expectSchema(outputType('MyObjectType', objectStructure));
    });
  });

  describe('inputType', () => {
    it('returns GraphQLInputType', () => {
      expectSchema(outputType('MyObjectType', objectStructure));
    });
  });
});
