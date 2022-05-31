import { AstMetadata, EXTENSIONS, ProfileDocumentNode } from '@superfaceai/ast';
import { Parser, SuperJson } from '@superfaceai/one-sdk';
import { ProfileId, ProfileVersion } from '@superfaceai/parser';
import { ServiceClient } from '@superfaceai/service-client';
import * as fs from 'fs';
import { readdir, readFile } from 'fs/promises';
import { mocked } from 'ts-jest/utils';
import { exists } from './io';
import { load, findLocalSource, fetchAST } from './profile';
import { getClient } from './registry';

jest.mock('fs/promises');
jest.mock('./io');
jest.mock('./registry');

const DEFAULT_PROFILE_VERSION_STR = '1.0.0';

describe('profile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const profileId = ProfileId.fromParameters({
    scope: 'scope',
    name: 'name',
  });
  const mockProfileSource = 'mock profile source';

  const astMetadata: AstMetadata = {
    sourceChecksum: 'check',
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
  };

  const validProfileDocument: ProfileDocumentNode = {
    astMetadata,
    kind: 'ProfileDocument',
    header: {
      kind: 'ProfileHeader',
      name: profileId.name,
      scope: profileId.scope,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    },
    definitions: [],
  };

  describe('load', () => {
    it('loads local profile source and parses it to AST', async () => {
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);

      const parseProfileSpy = jest
        .spyOn(Parser, 'parseProfile')
        .mockResolvedValue(validProfileDocument);

      await expect(
        load(new SuperJson(), profileId.withoutVersion, { version: '1.0.0' }),
      ).resolves.toEqual({
        ast: validProfileDocument,
      });

      expect(parseProfileSpy).toHaveBeenCalledWith(
        mockProfileSource,
        profileId.withoutVersion,
        {
          profileName: profileId.name,
          scope: profileId.scope,
        },
      );
    });

    it('loads AST from store', async () => {
      mocked(getClient).mockReturnValue({
        getProfileAST: jest
          .fn()
          .mockResolvedValue(JSON.stringify(validProfileDocument)),
      } as unknown as ServiceClient);

      const parseProfileSpy = jest.spyOn(Parser, 'parseProfile');

      await expect(
        load(new SuperJson(), profileId.withoutVersion, { version: '1.0.0' }),
      ).resolves.toEqual({
        ast: validProfileDocument,
      });

      expect(parseProfileSpy).not.toHaveBeenCalled();
      expect(getClient).toHaveBeenCalled();
    });
  });

  describe('findLocalSource', () => {
    it('returns source if profile with scope and version exists', async () => {
      const profileIdWithVersion = ProfileId.fromParameters({
        scope: profileId.scope,
        name: profileId.name,
        version: ProfileVersion.fromString('1.0.0'),
      });
      const mockSuperJson = new SuperJson();
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);

      await expect(
        findLocalSource(mockSuperJson, profileIdWithVersion),
      ).resolves.toEqual({
        source: mockProfileSource,
        path: expect.stringContaining(
          `grid/${profileIdWithVersion.toString()}`,
        ),
      });

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`grid/${profileIdWithVersion.toString()}`),
      );
    });

    it('returns undefined if profile with scope and version does not exist in grid', async () => {
      const profileIdWithVersion = ProfileId.fromParameters({
        scope: profileId.scope,
        name: profileId.name,
        version: ProfileVersion.fromString('1.0.0'),
      });

      const mockSuperJson = new SuperJson();
      mocked(exists).mockResolvedValue(false);
      mocked(readFile).mockResolvedValue(mockProfileSource);

      await expect(
        findLocalSource(mockSuperJson, profileIdWithVersion),
      ).resolves.toBeUndefined();

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`grid/${profileIdWithVersion.toString()}`),
      );
    });

    it('returns source if profile with version exists', async () => {
      const profileWithoutScope = ProfileId.fromParameters({
        name: profileId.name,
        version: ProfileVersion.fromString('1.0.0'),
      });
      const mockSuperJson = new SuperJson();

      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);

      await expect(
        findLocalSource(mockSuperJson, profileWithoutScope),
      ).resolves.toEqual({
        source: mockProfileSource,
        path: expect.stringContaining(`grid/${profileWithoutScope.toString()}`),
      });

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`grid/${profileWithoutScope.toString()}`),
      );
    });

    it('returns source if profile with scope exists', async () => {
      const mockSuperJson = new SuperJson();
      const mockFiles: fs.Dirent[] = [
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => true,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        },
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => true,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.build}`,
        },
      ];
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);
      mocked(readdir).mockResolvedValue(mockFiles);

      await expect(findLocalSource(mockSuperJson, profileId)).resolves.toEqual({
        source: mockProfileSource,
        path: expect.stringContaining(
          `grid/${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        ),
      });

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`${profileId.withoutVersion}`),
      );
      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(
          `grid/${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        ),
      );
    });

    it('returns source if profile with scope exists - dirent is symbolic link', async () => {
      const mockSuperJson = new SuperJson();
      const mockFiles: fs.Dirent[] = [
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => true,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => false,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        },
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => true,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.build}`,
        },
      ];
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);
      mocked(readdir).mockResolvedValue(mockFiles);

      await expect(findLocalSource(mockSuperJson, profileId)).resolves.toEqual({
        source: mockProfileSource,
        path: expect.stringContaining(
          `grid/${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        ),
      });

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining('grid/scope'),
      );
      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(
          `grid/${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        ),
      );
    });

    it('returns undefined if profile with scope exists but dirent does not end with source extension', async () => {
      const mockSuperJson = new SuperJson();
      const mockFiles: fs.Dirent[] = [
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => true,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => false,
          isSocket: () => false,
          name: `${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.build}`,
        },
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => true,
          isSocket: () => false,
          name: `${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.build}`,
        },
      ];
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);
      mocked(readdir).mockResolvedValue(mockFiles);

      await expect(
        findLocalSource(mockSuperJson, profileId),
      ).resolves.toBeUndefined();

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`grid/${profileId.scope}`),
      );
    });

    it('returns undefined if profile with scope exists but dirent name does not', async () => {
      const mockSuperJson = new SuperJson();
      const mockFiles: fs.Dirent[] = [
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => true,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => false,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        },
        {
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFIFO: () => false,
          isFile: () => true,
          isSocket: () => false,
          name: `${profileId.name}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.build}`,
        },
      ];
      mocked(exists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mocked(readFile).mockResolvedValue(mockProfileSource);
      mocked(readdir).mockResolvedValue(mockFiles);

      await expect(
        findLocalSource(mockSuperJson, profileId),
      ).resolves.toBeUndefined();

      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(`grid/${profileId.scope}`),
      );
      expect(exists).toHaveBeenCalledWith(
        expect.stringContaining(
          `grid/${profileId.withoutVersion}@${DEFAULT_PROFILE_VERSION_STR}${EXTENSIONS.profile.source}`,
        ),
      );
    });

    it('returns source if profile with scope and version exists in super json file property', async () => {
      const testPath = `my/beloved/test/path/to/${profileId.toString()}`;
      const mockSuperJson = new SuperJson({
        profiles: {
          [`${profileId.withoutVersion}`]: {
            file: testPath,
          },
        },
      });
      mocked(exists).mockResolvedValueOnce(true);
      mocked(readFile).mockResolvedValue(mockProfileSource);

      await expect(findLocalSource(mockSuperJson, profileId)).resolves.toEqual({
        source: mockProfileSource,
        path: expect.stringContaining(testPath),
      });

      expect(exists).toHaveBeenCalledWith(expect.stringContaining(testPath));
    });

    it('returns undefined if profile with scope does not exists in super json file property', async () => {
      const testPath = `my/beloved/test/path/to/${profileId.withoutVersion}`;
      const mockSuperJson = new SuperJson({
        profiles: {
          [`${profileId.withoutVersion}`]: {
            file: testPath,
          },
        },
      });
      mocked(exists).mockResolvedValue(false);
      mocked(readFile).mockResolvedValue('"mockProfileSource"');

      await expect(
        findLocalSource(mockSuperJson, profileId),
      ).resolves.toBeUndefined();

      expect(exists).toHaveBeenCalledWith(expect.stringContaining(testPath));
    });
  });

  describe('fetchAST', () => {
    let getProfileAST: jest.Mock;

    beforeEach(async () => {
      getProfileAST = jest
        .fn()
        .mockResolvedValue(JSON.stringify(validProfileDocument));

      mocked(getClient).mockReturnValue({
        getProfileAST,
      } as unknown as ServiceClient);

      await fetchAST(ProfileId.fromId('scope/name'));
    });

    it('calls getClient', () => {
      expect(getClient).toBeCalled();
    });

    it('calls getProfileAST with authenticate = true', () => {
      expect(getProfileAST).toBeCalledWith(
        {
          scope: 'scope',
          name: 'name',
        },
        {
          authenticate: true,
        },
      );
    });
  });
});
