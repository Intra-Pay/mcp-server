import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { intrapayClient } from '../intrapay/client';

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
      const res = await intrapayClient.createWebhook({ url: args.url, events: args.events, secret: args.secret });
      const output = { id: res.id, url: res.url, events: res.events, active: res.active, rawResponse: res };
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
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
      const res = await intrapayClient.listWebhooks();
      const output = { webhooks: res.webhooks, rawResponse: res };
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );
};