import { NormalizedProfileSettings } from '@superfaceai/ast';
import {
  ObjectStructure,
  PrimitiveStructure,
  StructureType,
} from '@superfaceai/parser';
import { GraphQLObjectType, GraphQLString } from 'graphql';
import {
  enumType,
  generateProfileConfig,
  generateProfileTypes,
  generateRootType,
  generateStructureResultType,
  generateUseCaseFieldConfig,
  generateUseCaseOptionsInputType,
  generateUseCaseProviderParametersFields,
  outputType,
  primitiveType,
  ProviderSettingsRecord,
  scalarType,
} from './schema.types';
import {
  expectSchema,
  getProfileOutput,
  parseProfileFixture,
} from './spec_helpers';

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
      enums: [{ name: 'ONE', value: 'one' }, { value: 'TWO' }],
      title: 'Enum title',
      description: 'Enum description',
    },
  },
};

describe('schema.types', () => {
  const profileSettings: NormalizedProfileSettings = {
    version: '1.0.0',
    defaults: {},
    priority: ['mock'],
    providers: {
      mock: {
        defaults: {},
      },
      superface: {
        defaults: {},
      },
    },
  };

  const providers: ProviderSettingsRecord = {
    mock: {
      security: [],
      parameters: {},
    },
    superface: {
      security: [],
      parameters: {
        accessToken: '$SUPERFACE_ACCESS_TOKEN',
      },
    },
  };

  describe('generateProfileTypes', () => {
    it('skips QueryType if no safe usecase is present', async () => {
      const profileAst = await parseProfileFixture('unsafe_only');

      const result = await generateProfileTypes(
        'ScopeName',
        profileAst,
        profileSettings,
        providers,
      );

      expect(result.QueryType).toBeUndefined();
    });

    it('skips MutationType if only safe usecases are present', async () => {
      const profileAst = await parseProfileFixture('safe_only');

      const result = await generateProfileTypes(
        'ScopeName',
        profileAst,
        profileSettings,
        providers,
      );

      expect(result.MutationType).toBeUndefined();
    });
  });

  describe('generateUseCaseFieldConfig', () => {
    it('throws if usecase is missing result', async () => {
      const profileAst = await parseProfileFixture('no_result');
      const profileOutput = await getProfileOutput('no_result', profileAst);

      expect(() =>
        generateUseCaseFieldConfig(
          'ScopeName',
          profileAst,
          profileSettings,
          profileOutput.usecases[0],
          providers,
        ),
      ).toThrowError();
    });

    describe('for profile fixture', () => {
      it('creates field config with arguments, resolver and description', async () => {
        const profileAst = await parseProfileFixture('profile');
        const profileOutput = await getProfileOutput('profile', profileAst);
        const config = generateUseCaseFieldConfig(
          'ScopeName',
          profileAst,
          profileSettings,
          profileOutput.usecases[0],
          providers,
        );

        expect(config).toMatchSnapshot();
      });
    });
  });

  describe('generateProfileConfig', () => {
    it('creates config with description and resolve function', async () => {
      const profileAst = await parseProfileFixture('profile');

      expect(
        generateProfileConfig(
          new GraphQLObjectType({ name: 'Test', fields: {} }),
          profileAst,
        ),
      ).toMatchSnapshot();
    });
  });

  describe('generateStructureResultType', () => {
    it('creates ScopeNameResult with description and result field', async () => {
      const profileOutput = await getProfileOutput('profile');
      expectSchema(
        generateStructureResultType(
          'ScopeNameResult',
          profileOutput.usecases[0].result as StructureType,
        ),
      );
    });
  });

  describe('generateUseCaseOptionsInputType', () => {
    it('creates input with providers enum and input parameters', () => {
      expectSchema(
        generateUseCaseOptionsInputType('Test', profileSettings, providers),
      );
    });
  });

  describe('generateUseCaseProviderParametersFields', () => {
    it('generates provider parameters for configured providers', () => {
      expect(
        generateUseCaseProviderParametersFields(
          ['superface', 'mock'],
          providers,
        ),
      ).toMatchSnapshot();
    });

    it('returns undefined when no parameters are configured', () => {
      const emptyProvider = { security: [], parameters: {} };
      expect(
        generateUseCaseProviderParametersFields(['foo', 'bar'], {
          foo: emptyProvider,
          bar: emptyProvider,
        }),
      ).toBeUndefined();
    });
  });

  describe('generateRootType', () => {
    it('create Query type with profiles', () => {
      expectSchema(
        generateRootType('Query', [
          new GraphQLObjectType({
            name: 'ProfileOne',
            fields: {
              field: {
                type: GraphQLString, // Shortcut for tests, structure here is more complicated
              },
            },
          }),
          new GraphQLObjectType({
            name: 'Scope',
            fields: {
              ProfileTwo: {
                type: new GraphQLObjectType({
                  name: 'ScopeProfileTwo',
                  fields: {
                    UseCase: {
                      type: GraphQLString,
                    },
                  },
                }),
              },
            },
          }),
        ]),
      );
    });
  });

  describe('primitveType', () => {
    it('throws error if type is unknown', () => {
      expect(() =>
        primitiveType('', { kind: 'PrimitiveStructure' } as PrimitiveStructure),
      ).toThrowError();
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
          enums: [{ name: 'O_N_E', value: 'ONE' }, { value: 'TWO' }],
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
