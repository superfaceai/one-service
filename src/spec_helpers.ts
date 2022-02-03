import { ProfileDocumentNode, ProviderEntry } from '@superfaceai/ast';
import { SuperJson } from '@superfaceai/one-sdk';
import {
  getProfileOutput as parserGetProfileOutput,
  getProfileUsecases as parserGetProfileUsecases,
  parseProfile,
  ProfileId,
  ProfileOutput,
  ProfileVersion,
  Source,
  UseCaseInfo,
} from '@superfaceai/parser';
import { readFile } from 'fs/promises';
import { GraphQLSchema, printSchema, validateSchema } from 'graphql';
import { basename, join as joinPath } from 'path';

const mockProvider = {
  mock: {
    security: [],
  },
};

export async function createSuperJson(
  profileFixtureName: string,
  profileAst?: ProfileDocumentNode,
  providers?: Record<string, ProviderEntry>,
): Promise<SuperJson> {
  const file = fixturePath(`${profileFixtureName}.supr`);

  if (!profileAst) {
    profileAst = await parseProfileFixture(profileFixtureName);
  }

  const profile = ProfileId.fromParameters(profileAst.header).withoutVersion;

  const version = ProfileVersion.fromParameters(
    profileAst.header.version,
  ).toString();

  providers ??= mockProvider;

  const [providerName] = Object.entries(providers)[0];

  return new SuperJson({
    profiles: {
      [profile]: {
        file,
        version,
        providers: {
          [providerName]: {},
        },
      },
    },
    providers,
  });
}

export async function parseProfileFixture(
  profileFixtureName: string,
): Promise<ProfileDocumentNode> {
  const path = fixturePath(`${profileFixtureName}.supr`);
  const content = await readFile(path, {
    encoding: 'utf8',
  });
  const source = new Source(content, basename(path));

  return parseProfile(source);
}

export async function getProfileOutput(
  profileFixtureName: string,
  profileAst?: ProfileDocumentNode,
): Promise<ProfileOutput> {
  if (!profileAst) {
    profileAst = await parseProfileFixture(profileFixtureName);
  }

  return parserGetProfileOutput(profileAst);
}

export async function getProfileUsecases(
  profileFixtureName: string,
  profileAst?: ProfileDocumentNode,
): Promise<UseCaseInfo[]> {
  if (!profileAst) {
    profileAst = await parseProfileFixture(profileFixtureName);
  }

  return parserGetProfileUsecases(profileAst);
}

export function fixturePath(fixture: string): string {
  return joinPath(__dirname, 'fixtures', fixture);
}

export function expectSchema(value: any) {
  if (!(value instanceof GraphQLSchema)) {
    value = new GraphQLSchema({
      types: [value],
    });
  }

  expect(printSchema(value)).toMatchSnapshot();
}

export function expectSchemaValidationErrors(value: any) {
  expect(validateSchema(value)).toMatchSnapshot();
}
