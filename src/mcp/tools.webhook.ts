import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { intrapayClient } from '../intrapay/client';
import { env } from '../config/env.js';
import { buildSuccess, normalizeIntraPayError } from '../utils/errors.js';

export const registerWebhookTools = (server: McpServer) => {
  server.registerTool(
    'intrapay_webhook_create',
    {
      title: 'Criar Webhook',
      description: 'Cria webhook para eventos da Intra Pay',
      inputSchema: { url: z.string().url(), events: z.array(z.string()), secret: z.string().optional() },
      outputSchema: { id: z.string(), url: z.string().url(), events: z.array(z.string()), active: z.boolean(), rawResponse: z.any() },
    },
    async (args) => {
      try {
        const secret = args.secret ?? env.webhookSecret;
        const res = await intrapayClient.createWebhook({ url: args.url, events: args.events, secret });
        const data = { id: res.id, url: res.url, events: res.events, active: res.active, rawResponse: res };
        const output = buildSuccess(data);
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
      } catch (e) {
        const err = normalizeIntraPayError((e as any).httpStatus || 500, e);
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
    }
  );

  server.registerTool(
    'intrapay_webhook_list',
    {
      title: 'Listar Webhooks',
      description: 'Lista webhooks configurados',
      inputSchema: {},
      outputSchema: { webhooks: z.array(z.object({ id: z.string(), url: z.string(), events: z.array(z.string()), active: z.boolean() })), rawResponse: z.any() },
    },
    async () => {
      try {
        const res = await intrapayClient.listWebhooks();
        const output = buildSuccess({ webhooks: res.webhooks, rawResponse: res });
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
      } catch (e) {
        const err = normalizeIntraPayError((e as any).httpStatus || 500, e);
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
    }
  );
};