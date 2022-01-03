import { ObjectStructure } from '@superfaceai/parser';
import { enumType, outputType, scalarType } from './schema.types';
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

describe('schema.types', () => {
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
