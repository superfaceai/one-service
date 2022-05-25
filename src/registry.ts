import { ServiceClient } from '@superfaceai/service-client';
import { VERSION as SDK_VERSION } from '@superfaceai/one-sdk';
import { VERSION as PARSER_VERSION } from '@superfaceai/parser';
import { URL } from 'url';
import { VERSION } from '.';

export const SF_API_URL_VARIABLE = 'SUPERFACE_API_URL';
export const SF_PRODUCTION = 'https://superface.ai';

let client: ServiceClient | undefined;

export function getClient(): ServiceClient {
  if (client === undefined) {
    client = new ServiceClient({
      baseUrl: getServicesUrl(),
      refreshToken: process.env.SUPERFACE_REFRESH_TOKEN,
      commonHeaders: { 'User-Agent': getUserAgent() },
    });
  }

  return client;
}

export function getServicesUrl(): string {
  const envUrl = process.env[SF_API_URL_VARIABLE];

  if (envUrl) {
    const passedValue = new URL(envUrl).href;
    //remove ending /
    if (passedValue.endsWith('/')) {
      return passedValue.substring(0, passedValue.length - 1);
    }

    return passedValue;
  }

  return SF_PRODUCTION;
}

export function getUserAgent(): string {
  return `superface one-service/${VERSION} (${process.platform}-${process.arch}) ${process.release.name}-${process.version} (with @superfaceai/one-sdk@${SDK_VERSION}, @superfaceai/parser@${PARSER_VERSION})`;
}
