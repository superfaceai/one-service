import { NormalizedSuperJsonDocument, ProviderJson } from '@superfaceai/ast';
import {
  Config,
  NodeFileSystem,
  resolveProviderJson,
} from '@superfaceai/one-sdk';

export async function load(
  superJson: NormalizedSuperJsonDocument,
  providerName: string,
): Promise<ProviderJson> {
  const providerJson = await resolveProviderJson({
    providerName,
    superJson,
    fileSystem: NodeFileSystem,
    config: new Config(NodeFileSystem),
  });

  if (!providerJson) {
    throw new Error(`Provider ${providerName} couldn't be resolved`); // TODO: custom error
  }

  return providerJson;
}
