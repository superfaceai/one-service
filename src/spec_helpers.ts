import {
  ProfileDocumentNode,
  NormalizedSuperJsonDocument,
  SuperJsonDocument,
} from '@superfaceai/ast';
import { normalizeSuperJsonDocument } from '@superfaceai/one-sdk';
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
import { readFile, writeFile } from 'fs/promises';
import { GraphQLSchema, printSchema, validateSchema } from 'graphql';
import { basename, join as joinPath } from 'path';

export async function createSuperJson(
  profileFixtureNames: string[],
): Promise<NormalizedSuperJsonDocument> {
  const superJson: SuperJsonDocument = {};
  const providerFile = fixturePath(`test.provider.json`);

  for (const profileFixtureName of profileFixtureNames) {
    const profileFile = fixturePath(`${profileFixtureName}.supr`);

    const profileAst = await parseProfileFixture(profileFixtureName);
    const profile = ProfileId.fromParameters(profileAst.header).withoutVersion;

    const version = ProfileVersion.fromParameters(
      profileAst.header.version,
    ).toString();

    superJson.profiles = {
      ...superJson.profiles,
      [profile]: {
        file: profileFile,
        version,
        providers: {
          test: {},
        },
      },
    };
  }

  superJson.providers = {
    test: {
      file: providerFile,
    },
  };

  return normalizeSuperJsonDocument(superJson);
}

export async function parseProfileFixture(
  profileFixtureName: string,
): Promise<ProfileDocumentNode> {
  const path = fixturePath(`${profileFixtureName}.supr`);
  const content = await readFile(path, {
    encoding: 'utf8',
  });
  const source = new Source(content, basename(path));

  const ast = parseProfile(source);

  await writeFile(
    fixturePath(`${profileFixtureName}.supr.ast.json`),
    JSON.stringify(ast),
  );

  return ast;
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
