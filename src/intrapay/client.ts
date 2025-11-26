import { env } from '../config/env';
import { logger } from '../utils/logger';
import { normalizeIntraPayError } from '../utils/errors';
import {
  AuthResponse,
  CreateStaticPixRequest,
  CreateStaticPixResponse,
  CreateDynamicImmediatePixRequest,
  CreateDynamicImmediatePixResponse,
  CreateDynamicDuedatePixRequest,
  CreateDynamicDuedatePixResponse,
  GetPixStatusResponse,
  PixCashOutByAccountRequest,
  PixCashOutByKeyRequest,
  PixCashOutByEmvRequest,
  PixCashOutResponse,
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListWebhooksResponse,
} from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const PATHS = {
  authToken: '/api/financial/v1/auth/token',
  cashInStatic: '/api/financial/v1/pix-cash-in/static',
  cashInImmediate: '/api/financial/v1/pix-cash-in/immediate',
  cashInDuedate: '/api/financial/v1/pix-cash-in/duedate',
  cashOutAccount: '/api/financial/v1/pix-cash-out/account',
  cashOutKey: '/api/financial/v1/pix-cash-out/key',
  cashOutEmv: '/api/financial/v1/pix-cash-out/emv',
  webhooks: '/api/financial/v1/webhooks',
};

class TokenCache {
  private token: string | null = null;
  private expiresAt: number | null = null;
  set(token: string, ttlSeconds: number) {
    const skew = 60;
    this.token = token;
    this.expiresAt = Date.now() + (ttlSeconds - skew) * 1000;
  }
  get() {
    if (!this.token || !this.expiresAt || Date.now() >= this.expiresAt) return null;
    return this.token;
  }
  clear() {
    this.token = null;
    this.expiresAt = null;
  }
}

export class IntraPayClient {
  private tokenCache = new TokenCache();

  private async request<T>(path: string, method: HttpMethod, body?: unknown, auth = true): Promise<T> {
    const url = `${env.baseUrl}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = await this.getToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: unknown;
    while (attempt < maxAttempts) {
      try {
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (!res.ok) {
          let details: unknown = undefined;
          try {
            details = await res.json();
          } catch {
            details = await res.text().catch(() => undefined);
          }
          logger.warn('http_retry_candidate', { method, endpoint: path, status: res.status, attempt });
          if (res.status === 429 || (res.status >= 500 && res.status <= 504)) {
            const waitMs = 200 * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
            await new Promise((r) => setTimeout(r, waitMs));
            attempt++;
            lastError = normalizeIntraPayError(res.status, details);
            continue;
          }
          logger.error('http_error', { method, endpoint: path, status: res.status });
          throw normalizeIntraPayError(res.status, details);
        }
        logger.info('http_success', { method, endpoint: path, status: res.status });
        return (await res.json()) as T;
      } catch (e) {
        logger.warn('network_error_retry', { method, endpoint: path, attempt });
        const waitMs = 200 * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
        await new Promise((r) => setTimeout(r, waitMs));
        attempt++;
        lastError = e;
      }
    }
    if (lastError && typeof lastError === 'object' && (lastError as any).httpStatus) throw lastError as any;
    throw normalizeIntraPayError(500, { reason: 'retry_exhausted', method, path }, 'Falha ao chamar API após retries');
  }

  async authenticate(): Promise<AuthResponse> {
    const payload = { clientKey: env.clientKey, clientSecret: env.clientSecret };
    const res = await this.request<AuthResponse>(PATHS.authToken, 'POST', payload, false);
    this.tokenCache.set(res.clientToken, res.expiresIn);
    return res;
  }

  private async getToken(): Promise<string> {
    const cached = this.tokenCache.get();
    if (cached) return cached;
    const res = await this.authenticate();
    return res.clientToken;
  }

  async createStaticQRCode(payload: CreateStaticPixRequest): Promise<CreateStaticPixResponse> {
    const res = await this.request<CreateStaticPixResponse>(PATHS.cashInStatic, 'POST', payload);
    logger.info('pix_static_created', { transactionId: res.transactionId });
    return res;
  }

  async createDynamicImmediateQRCode(
    payload: CreateDynamicImmediatePixRequest
  ): Promise<CreateDynamicImmediatePixResponse> {
    const res = await this.request<CreateDynamicImmediatePixResponse>(PATHS.cashInImmediate, 'POST', payload);
    logger.info('pix_immediate_created', { transactionId: res.transactionId });
    return res;
  }

  async createDynamicDuedateQRCode(
    payload: CreateDynamicDuedatePixRequest
  ): Promise<CreateDynamicDuedatePixResponse> {
    const res = await this.request<CreateDynamicDuedatePixResponse>(PATHS.cashInDuedate, 'POST', payload);
    logger.info('pix_duedate_created', { transactionId: res.transactionId });
    return res;
  }

  async getPixChargeStatus(_txid: string): Promise<GetPixStatusResponse> {
    throw normalizeIntraPayError(501, { txid: _txid }, 'Endpoint de status não implementado');
  }

  async pixCashOutByAccount(payload: PixCashOutByAccountRequest): Promise<PixCashOutResponse> {
    const res = await this.request<PixCashOutResponse>(PATHS.cashOutAccount, 'POST', payload);
    logger.info('pix_cashout_account', { endToEndId: res.endToEndId });
    return res;
  }

  async pixCashOutByKey(payload: PixCashOutByKeyRequest): Promise<PixCashOutResponse> {
    const res = await this.request<PixCashOutResponse>(PATHS.cashOutKey, 'POST', payload);
    logger.info('pix_cashout_key', { endToEndId: res.endToEndId });
    return res;
  }

  async pixCashOutByEmv(payload: PixCashOutByEmvRequest): Promise<PixCashOutResponse> {
    const res = await this.request<PixCashOutResponse>(PATHS.cashOutEmv, 'POST', payload);
    logger.info('pix_cashout_emv', { endToEndId: res.endToEndId });
    return res;
  }

  async createWebhook(payload: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    const res = await this.request<CreateWebhookResponse>(PATHS.webhooks, 'POST', payload);
    logger.info('webhook_created', { id: res.id });
    return res;
  }

  async listWebhooks(): Promise<ListWebhooksResponse> {
    const res = await this.request<ListWebhooksResponse>(PATHS.webhooks, 'GET');
    logger.info('webhook_list');
    return res;
  }
}

export const intrapayClient = new IntraPayClient();