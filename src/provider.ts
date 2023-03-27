import { NormalizedSuperJsonDocument, ProviderJson } from '@superfaceai/ast';
import {
  Config,
  fetchProviderInfo,
  NodeCrypto,
  NodeFetch,
  NodeFileSystem,
  NodeTimers,
  resolveProviderJson,
} from '@superfaceai/one-sdk';

export async function load(
  superJson: NormalizedSuperJsonDocument,
  providerName: string,
): Promise<ProviderJson> {
  const config = new Config(NodeFileSystem);

  // Load from local file
  let providerJson = await resolveProviderJson({
    providerName,
    superJson,
    fileSystem: NodeFileSystem,
    config,
  });

  // Load from registry
  if (!providerJson) {
    try {
      providerJson = await fetchProviderInfo(
        providerName,
        config,
        new NodeCrypto(),
        new NodeFetch(new NodeTimers()),
      );
    } catch (_e) {
      // Ignore error
    }
  }

  // Throw error if provider not found
  if (!providerJson) {
    throw new Error(`Provider '${providerName}' not found`);
  }

  return providerJson;
}
