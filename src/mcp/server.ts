import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '../config/env';
import { registerHealthTool } from './tools.health';
import { registerPixTools } from './tools.pix';
import { registerWebhookTools } from './tools.webhook';
import { IntraPayClient } from '../intrapay/client';
import { runWithClient } from '../utils/context';

const app = express();
app.use(express.json());

const server = new McpServer({ name: 'intrapay-mcp', version: '1.0.0' });
registerHealthTool(server);
registerPixTools(server);
registerWebhookTools(server);

app.post('/mcp', async (req, res) => {
  try {
    const clientKey = req.headers['x-intrapay-client-key'] as string;
    const clientSecret = req.headers['x-intrapay-client-secret'] as string;

    let client: IntraPayClient | undefined;

    if (clientKey && clientSecret) {
      client = new IntraPayClient({ clientKey, clientSecret });
    }

    const executeTransport = async () => {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => transport.close());
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    };

    if (client) {
      await runWithClient(client, executeTransport);
    } else {
      await executeTransport();
    }
  } catch (e) {
    const payload = {
      ok: false,
      result: 'error',
      errorCode: 'UNKNOWN_ERROR',
      message: e instanceof Error ? e.message : 'Erro desconhecido',
      details: e,
    };
    res.status(500).json(payload);
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.port);
