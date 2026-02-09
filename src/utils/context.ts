import { AsyncLocalStorage } from 'node:async_hooks';
import { IntraPayClient, intrapayClient as defaultClient } from '../intrapay/client';

const clientStorage = new AsyncLocalStorage<IntraPayClient>();

export const runWithClient = <T>(client: IntraPayClient, fn: () => T): T => {
  return clientStorage.run(client, fn);
};

export const getCurrentClient = (): IntraPayClient => {
  const client = clientStorage.getStore();
  return client || defaultClient;
};
