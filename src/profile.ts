import {
  ProfileDocumentNode,
  NormalizedSuperJsonDocument,
} from '@superfaceai/ast';
import {
  resolveProfileAst,
  NodeFetch,
  Config,
  NodeFileSystem,
  NodeTimers,
  NodeCrypto,
} from '@superfaceai/one-sdk';

export async function load(
  superJson: NormalizedSuperJsonDocument,
  profileId: string,
): Promise<{ ast: ProfileDocumentNode }> {
  const profileSettings = superJson.profiles[profileId];

  const ast = await resolveProfileAst({
    profileId,
    version:
      profileSettings && 'file' in profileSettings
        ? undefined
        : profileSettings.version,
    superJson,
    config: new Config(NodeFileSystem),
    crypto: new NodeCrypto(),
    fetchInstance: new NodeFetch(new NodeTimers()),
    fileSystem: NodeFileSystem,
  });

  return { ast };
}
