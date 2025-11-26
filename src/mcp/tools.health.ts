import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { intrapayClient } from '../intrapay/client';
import { env } from '../config/env';

export const registerHealthTool = (server: McpServer) => {
  server.registerTool(
    'intrapay_health_check',
    {
      title: 'Intra Pay Health Check',
      description: 'Verifica credenciais e resposta da API Intra Pay',
      inputSchema: {},
      outputSchema: { status: z.enum(['ok', 'error']), env: z.enum(['sandbox', 'production']), details: z.any().optional() },
    },
    async () => {
      try {
        const r = await intrapayClient.authenticate();
        const output = { status: 'ok' as const, env: env.environment, details: { expiresIn: r.expiresIn } };
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
      } catch (e) {
        const output = { status: 'error' as const, env: env.environment, details: e };
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
      }
    }
  );
};