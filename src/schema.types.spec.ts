import {
  NormalizedProfileSettings,
  SecurityType,
  HttpScheme,
  ProviderJson,
  ApiKeyPlacement,
} from '@superfaceai/ast';
import {
  ObjectStructure,
  PrimitiveStructure,
  StructureType,
} from '@superfaceai/parser';
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  enumType,
  generateProfileConfig,
  generateProfileTypes,
  generateRootType,
  generateStructureResultType,
  generateUseCaseFieldConfig,
  generateProfileProviderOptionInputType,
  generateUseCaseProviderParametersFields,
  generateUseCaseSecurityFields,
  outputType,
  primitiveType,
  ProvidersJsonRecord,
  scalarType,
  prepareProviderConfigTypeMap,
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
      'gql_bad-name': {
        defaults: {},
      },
    },
  };

  const providersJsons: ProvidersJsonRecord = {
    mock: {
      name: 'mock',
      defaultService: 'default',
      services: [
        {
          id: 'default',
          baseUrl: 'loop.back',
        },
      ],
    },
    superface: {
      name: 'superface',
      defaultService: 'default',
      services: [
        {
          id: 'default',
          baseUrl: 'https://superface.test',
        },
      ],
      securitySchemes: [
        {
          id: 'api_key',
          type: SecurityType.APIKEY,
          in: ApiKeyPlacement.HEADER,
          name: 'X-API-KEY',
        },
        {
          id: 'basic',
          type: SecurityType.HTTP,
          scheme: HttpScheme.BASIC,
        },
        {
          id: 'bearer_token',
          type: SecurityType.HTTP,
          scheme: HttpScheme.BEARER,
          bearerFormat: 'JWT',
        },
        {
          id: 'digest',
          type: SecurityType.HTTP,
          scheme: HttpScheme.DIGEST,
          statusCode: 401,
          authorizationHeader: 'Authorization',
          challengeHeader: 'www-authenticate',
        },
      ],
      parameters: [
        {
          name: 'accessToken',
        },
      ],
    },
    'gql_bad-name': {
      name: 'gql_bad-name',
      defaultService: 'default',
      services: [
        {
          id: 'default',
          baseUrl: 'https://superface.test',
        },
      ],
    },
  };

  const providerConfigTypeMap = prepareProviderConfigTypeMap(providersJsons);

  describe('generateProfileTypes', () => {
    it('skips QueryType if no safe usecase is present', async () => {
      const profileAst = await parseProfileFixture('unsafe_only');

      const result = await generateProfileTypes(
        'ScopeName',
        profileAst,
        profileSettings,
        providerConfigTypeMap,
      );

      expect(result.QueryType).toBeUndefined();
    });

    it('skips MutationType if only safe usecases are present', async () => {
      const profileAst = await parseProfileFixture('safe_only');

      const result = await generateProfileTypes(
        'ScopeName',
        profileAst,
        profileSettings,
        providerConfigTypeMap,
      );

      expect(result.MutationType).toBeUndefined();
    });
  });

  describe('generateUseCaseFieldConfig', () => {
    const ProfileProviderOptionType = new GraphQLInputObjectType({
      name: 'ScopeNameProviderOption',
      fields: {
        provider: {
          type: new GraphQLInputObjectType({
            name: 'ScopeNameProviderConfig',
            fields: {
              active: { type: GraphQLBoolean },
            },
          }),
        },
      },
    });

    describe('valid profile', () => {
      it('creates field config with arguments, resolver and description', async () => {
        const profileAst = await parseProfileFixture('profile');
        const profileOutput = await getProfileOutput('profile', profileAst);

        const config = generateUseCaseFieldConfig(
          'ScopeName',
          profileAst,
          profileOutput.usecases[0],
          ProfileProviderOptionType,
        );

        expect(config).toMatchSnapshot();
      });
    });

    describe('usecase with empty input', () => {
      it('creates arguments without input', async () => {
        const profileAst = await parseProfileFixture(
          'profile_with_empty_input_structure',
        );
        const profileOutput = await getProfileOutput(
          'profile_with_empty_input_structure',
          profileAst,
        );
        const config = generateUseCaseFieldConfig(
          'ScopeName',
          profileAst,
          profileOutput.usecases[0],
          ProfileProviderOptionType,
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

    it('creates ScopeNameResult as None value', async () => {
      const profileOutput = await getProfileOutput('no_result');
      expectSchema(
        generateStructureResultType(
          'ScopeNameResult',
          profileOutput.usecases[0].result as StructureType,
        ),
      );
    });

    it('creates ScopeNameResult as None value if result is empty object', async () => {
      const profileOutput = await getProfileOutput('profile_with_empty_result');
      expectSchema(
        generateStructureResultType(
          'ScopeNameResult',
          profileOutput.usecases[0].result as StructureType,
        ),
      );
    });

    it('creates ScopeNameResult if result contains nested empty object', async () => {
      const profileOutput = await getProfileOutput(
        'profile_with_empty_nested_object_in_result',
      );
      expectSchema(
        generateStructureResultType(
          'ScopeNameResult',
          profileOutput.usecases[0].result as StructureType,
        ),
      );
    });
  });

  describe('prepareProviderConfigTypeMap', () => {
    it('creates map of provider config types', () => {
      expect(prepareProviderConfigTypeMap(providersJsons)).toMatchSnapshot();
    });
  });

  describe('generateProfileProviderOptionInputType', () => {
    it('creates provider object with security and parameters field', () => {
      expectSchema(
        generateProfileProviderOptionInputType(
          'Test',
          profileSettings,
          providerConfigTypeMap,
        ),
      );
    });
  });

  describe('generateUseCaseProviderParametersFields', () => {
    it('generates provider parameters for configured providers', () => {
      expect(
        generateUseCaseProviderParametersFields(providersJsons, [
          'superface',
          'mock',
        ]),
      ).toMatchSnapshot();
    });

    it('returns undefined when no parameters are configured', () => {
      const emptyProvider: Omit<ProviderJson, 'name'> = {
        defaultService: 'default',
        services: [],
        securitySchemes: [],
        parameters: [],
      };
      expect(
        generateUseCaseProviderParametersFields(
          {
            foo: { name: 'foo', ...emptyProvider },
            bar: { name: 'bar', ...emptyProvider },
          },
          ['foo', 'bar'],
        ),
      ).toBeUndefined();
    });
  });

  describe('generateUseCaseSecurityFields', () => {
    it('generates security fields for configured providers', () => {
      expect(
        generateUseCaseSecurityFields(providersJsons, ['mock', 'superface']),
      ).toMatchSnapshot();
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
