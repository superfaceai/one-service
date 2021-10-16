import { SuperfaceClient } from '@superfaceai/one-sdk';

let oneSdk: SuperfaceClient;

export function getInstance() {
  if (!oneSdk) {
    oneSdk = new SuperfaceClient();
  }

  return oneSdk;
}
