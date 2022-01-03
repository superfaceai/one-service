import { SuperJson } from '@superfaceai/one-sdk';
import { GraphQLSchema, printSchema } from 'graphql';
import { join as joinPath } from 'path';

export function createSuperJson(profileFixtureName: string): SuperJson {
  return new SuperJson({
    profiles: {
      test: {
        file: joinPath(__dirname, 'fixtures', profileFixtureName),
        version: '1.0.0',
        providers: {
          mock: {},
        },
      },
    },
    providers: {
      mock: {
        security: [],
      },
    },
  });
}

export function expectSchema(type: any) {
  expect(
    printSchema(
      new GraphQLSchema({
        types: [type],
      }),
    ),
  ).toMatchSnapshot();
}
