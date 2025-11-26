import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '../config/env.js';
import { registerHealthTool } from './tools.health.js';
import { registerPixTools } from './tools.pix.js';
import { registerWebhookTools } from './tools.webhook.js';

const app = express();
app.use(express.json());

const server = new McpServer({ name: 'intrapay-mcp', version: '1.0.0' });
registerHealthTool(server);
registerPixTools(server);
registerWebhookTools(server);

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: env.environment });
});

app.listen(env.port);