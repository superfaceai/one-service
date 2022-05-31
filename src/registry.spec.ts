import { ServiceClient } from '@superfaceai/service-client';
import {
  getClient,
  getServicesUrl,
  SF_API_URL_VARIABLE,
  SF_PRODUCTION,
} from './registry';

jest.mock('@superfaceai/service-client');

describe('registry', () => {
  describe('getClient', () => {
    it('creates ServiceClient instance once', () => {
      getClient();
      getClient();

      expect(ServiceClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServiceUrl', () => {
    it('returns SF_PRODUCTION if no env variable is set', () => {
      const envUrl = process.env[SF_API_URL_VARIABLE];
      delete process.env[SF_API_URL_VARIABLE];

      expect(getServicesUrl()).toBe(SF_PRODUCTION);

      process.env[SF_API_URL_VARIABLE] = envUrl;
    });

    it('returns env variable if set', () => {
      const envUrl = 'https://superface.ai';
      process.env[SF_API_URL_VARIABLE] = envUrl;

      expect(getServicesUrl()).toBe(envUrl);
    });
  });
});
