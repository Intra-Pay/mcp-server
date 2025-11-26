import { describe, it, expect, beforeEach } from 'vitest';
import { IntraPayClient } from '../src/intrapay/client';

const originalFetch = global.fetch;

describe('IntraPayClient', () => {
  beforeEach(() => {
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/financial/v1/auth/token')) {
        return new Response(JSON.stringify({ clientToken: 't', expiresIn: 900 }), { status: 200 });
      }
      if (url.endsWith('/api/financial/v1/pix-cash-in/static')) {
        return new Response(
          JSON.stringify({
            id: 'id',
            amount: 150.5,
            status: 'PENDING',
            pixKey: 'key',
            pixKeyId: 'uuid',
            type: 'STATIC',
            emvqrcps: 'EMV',
            transactionId: 87452,
            transactionIdentification: 'E87452H20251024001',
            description: 'Desc',
            createdAt: '2025-10-24T13:00:00.000Z',
          }),
          { status: 200 }
        );
      }
      return new Response('', { status: 404 });
    }) as any;
  });

  it('authenticates and caches token', async () => {
    const client = new IntraPayClient();
    const res = await client.authenticate();
    expect(res.clientToken).toBe('t');
    const token = await (client as any).getToken();
    expect(token).toBe('t');
  });

  it('creates static qrcode', async () => {
    const client = new IntraPayClient();
    const res = await client.createStaticQRCode({ pixKeyId: 'uuid', amount: 150.5, additionalInformation: 'Pagamento' });
    expect(res.transactionIdentification).toBe('E87452H20251024001');
  });
});

global.fetch = originalFetch as any;