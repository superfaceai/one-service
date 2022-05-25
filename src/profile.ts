import {
  assertProfileDocumentNode,
  EXTENSIONS,
  ProfileDocumentNode,
  ProfileSettings,
} from '@superfaceai/ast';
import { Parser, SuperJson } from '@superfaceai/one-sdk';
import { ProfileId } from '@superfaceai/parser';
import { readdir, readFile } from 'fs/promises';
import { join as joinPath } from 'path';
import { exists } from './io';
import { getClient } from './registry';

export async function load(
  superJson: SuperJson,
  profile: string,
  profileSettings: ProfileSettings,
): Promise<{ ast: ProfileDocumentNode }> {
  const profileId = ProfileId.fromId(
    profile,
    profileSettings !== undefined && !('file' in profileSettings)
      ? profileSettings.version
      : undefined,
  );
  const source = await findLocalSource(superJson, profileId);

  if (source) {
    const ast = await Parser.parseProfile(
      source.source,
      profileId.withoutVersion,
      {
        profileName: profileId.name,
        scope: profileId.scope,
      },
    );

    return { ast };
  } else {
    const ast = await fetchAST(profileId);

    return {
      ast,
    };
  }
}

export async function findLocalSource(
  superJson: SuperJson,
  profileId: ProfileId,
): Promise<{ path: string; source: string } | undefined> {
  const profileSettings =
    superJson.normalized.profiles[profileId.withoutVersion];

  if (profileSettings !== undefined && 'file' in profileSettings) {
    const resolvedPath = superJson.resolvePath(profileSettings.file);
    if (await exists(resolvedPath)) {
      return {
        source: await readFile(resolvedPath, { encoding: 'utf-8' }),
        path: resolvedPath,
      };
    }
  }

  //try to look in the grid for source file
  const basePath = profileId.scope ? joinPath('grid', profileId.scope) : 'grid';
  const version = profileId.version ? profileId.version.toString() : null;

  if (version) {
    const path = joinPath(
      basePath,
      `${profileId.name}@${version}${EXTENSIONS.profile.source}`,
    );
    const resolvedPath = superJson.resolvePath(path);

    if (await exists(resolvedPath)) {
      return {
        source: await readFile(resolvedPath, { encoding: 'utf-8' }),
        path: resolvedPath,
      };
    }
  } else {
    //Look for any version
    const scopePath = superJson.resolvePath(basePath);

    if (await exists(scopePath)) {
      //Get files in profile directory
      const files = (await readdir(scopePath, { withFileTypes: true }))
        .filter((dirent) => dirent.isFile() || dirent.isSymbolicLink())
        .map((dirent) => dirent.name);

      //Find files with similar name to profile and with .supr extension
      const path = files.find(
        (f) =>
          f.startsWith(`${profileId.name}@`) &&
          f.endsWith(EXTENSIONS.profile.source),
      );

      if (path) {
        const resolvedPath = superJson.resolvePath(joinPath(basePath, path));

        if (await exists(resolvedPath)) {
          return {
            source: await readFile(resolvedPath, { encoding: 'utf-8' }),
            path: resolvedPath,
          };
        }
      }
    }
  }

  return;
}

export async function fetchAST(
  profileId: ProfileId,
): Promise<ProfileDocumentNode> {
  const response = await getClient().getProfileAST(
    {
      scope: profileId.scope,
      name: profileId.name,
      version: profileId.version?.toString(),
    },
    {
      authenticate: true,
    },
  );

  return assertProfileDocumentNode(JSON.parse(response));
}
