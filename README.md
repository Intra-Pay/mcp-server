# Intra Pay MCP Server

## O que é
- Servidor MCP que expõe ferramentas para operações Pix (cash-in/cash-out) e webhooks da Intra Pay, acessível por agentes/IDEs como Claude Desktop, Cursor e OpenAI Agents.

## Requisitos
- Node.js 20+

## Configuração
- `npm install`
- `cp .env.example .env`
- Preencha `INTRAPAY_BASE_URL`, `INTRAPAY_CLIENT_KEY`, `INTRAPAY_CLIENT_SECRET`, `INTRAPAY_ENV`, `PORT`.
- Em produção, habilite allowlist de IP no dashboard da Intra Pay.

## Execução
- `npm run dev`
- Endpoint MCP HTTP: `POST http://localhost:4000/mcp`
- Health: `GET http://localhost:4000/health`

## Conexão com MCP Clients
- Claude Desktop / Cursor (HTTP):
```yaml
servers:
  intrapay:
    url: http://localhost:4000/mcp
    type: http
```
- VS Code (CLI): `code --add-mcp "{\"name\":\"intrapay\",\"type\":\"http\",\"url\":\"http://localhost:4000/mcp\"}"`
- Claude Code (CLI): `claude mcp add --transport http intrapay http://localhost:4000/mcp`
- MCP Inspector: `npx @modelcontextprotocol/inspector` e conectar à URL `http://localhost:4000/mcp`

### OpenAI Agents (exemplo de chamada de tool)
```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({ url: 'http://localhost:4000/mcp' });
const client = new Client({ name: 'agent', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

// Descobrir tools
const tools = await client.request({ method: 'tools/list' });

// Chamar Pix estático
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'intrapay_pix_create_static_qrcode',
    args: { amount: 150.5, description: 'Serviço', metadata: { pixKeyId: '123e4567-e89b-12d3-a456-426614174000' } },
  },
});
console.log(result);
```

## Tools Disponíveis
- `intrapay_health_check`
- `intrapay_pix_create_static_qrcode`
- `intrapay_pix_create_dynamic_immediate_qrcode`
- `intrapay_pix_create_dynamic_duedate_qrcode`
- `intrapay_pix_get_charge_status`
- `intrapay_pix_cash_out_by_account`
- `intrapay_pix_cash_out_by_key`
- `intrapay_pix_cash_out_by_emv`
- `intrapay_webhook_create`
- `intrapay_webhook_list`

## Playbooks
- Gerar QR Code estático:
  - Prompt: `Use o tool intrapay_pix_create_static_qrcode para cobrar R$ 150,00, descrição "Serviço". metadata.pixKeyId = "<uuid-da-chave>".`
- Gerar QR Code dinâmico imediato:
  - Prompt: `Use intrapay_pix_create_dynamic_immediate_qrcode com amount=240, description="Serviço", additionalInfo.pixKeyId="<uuid>".`
- Gerar QR Code com vencimento:
  - Prompt: `Use intrapay_pix_create_dynamic_duedate_qrcode com amount=150.75, description="Consultoria", dueDate="2025-12-31", additionalInfo.pixKeyId="<uuid>".`
- Consultar status de cobrança:
  - Prompt: `Use intrapay_pix_get_charge_status com txid="E87452H20251024001".`
  - Observação: se o endpoint oficial não estiver disponível, o tool retorna `INTRAPAY_NOT_IMPLEMENTED`.
- Cash-out por chave:
  - Prompt: `Use intrapay_pix_cash_out_by_key com amount=25, pixKey="<EVP>", description="Pagamento" e informe em metadata endtoEndId, account e owner conforme doc.`
- Cash-out por EMV:
  - Prompt: `Use intrapay_pix_cash_out_by_emv com amount=2500 e emv="<payload EMV>".`
- Webhooks:
  - Prompt: `Use intrapay_webhook_create com url="https://meuapp/webhooks/intrapay" e events=["pix-payment-in"].`
  - Prompt: `Use intrapay_webhook_list`.

## Contratos da Intra Pay
- Autenticação:
  - `POST /api/financial/v1/auth/token`
  - Request: `{ clientKey, clientSecret }`
  - Response: `{ clientToken, expiresIn }` (token Bearer válido por 15 min)
- Pix Estático:
  - Request: `{ pixKeyId, amount, additionalInformation? }`
  - Response: `{ id, amount, status, pixKey, pixKeyId, type, emvqrcps, transactionId, transactionIdentification, description?, createdAt }`
- Pix Dinâmico Imediato:
  - Request: `{ pixKeyId, amount, additionalInformation?, debtor?, payerQuestion?, expiration? }`
  - Response: como estático + `expiresAt`
- Pix Dinâmico com Vencimento:
  - `POST /api/financial/v1/pix-cash-in/duedate`
  - Request: campos de descontos/abatimentos/juros/multa e `debtor` obrigatório
  - Response: inclui `dueDate`, `expiresAt`
- Cash Out por Conta:
  - Request: `{ account, branch, bank, amount, taxId, name, accountType, description?, password? }`
  - Response: `{ id?, endToEndId?, amount, fee?, status }`
- Cash Out por Chave:
  - Request: `{ key, keyType, endtoEndId, account, owner, amount?, description? }`
  - Response: `{ id, endToEndId, amount, fee, status }`
- Cash Out por EMV:
  - Fluxo em duas etapas; o tool aceita `{ emv, amount }` e consolida.

### Observações de Endpoints
- Autenticação e cobrança com vencimento possuem endpoints explícitos: `POST /api/financial/v1/auth/token` e `POST /api/financial/v1/pix-cash-in/duedate`.
- Os demais caminhos foram definidos seguindo a convenção da documentação e podem ser ajustados facilmente no objeto `PATHS` em `src/intrapay/client.ts` conforme versões futuras da API:
  - `cashInStatic`: `/api/financial/v1/pix-cash-in/static`
  - `cashInImmediate`: `/api/financial/v1/pix-cash-in/immediate`
  - `cashOutAccount`: `/api/financial/v1/pix-cash-out/account`
  - `cashOutKey`: `/api/financial/v1/pix-cash-out/key`
  - `cashOutEmv`: `/api/financial/v1/pix-cash-out/emv`
  - `getPixChargeStatus`: TODO (documentar quando disponível)

## Segurança e Logs
- Nunca logar `clientSecret` nem dados sensíveis.
- Logs incluem: método, endpoint, status HTTP, `txid`/`transactionId` quando aplicável.
- Erros padronizados:
```json
{ "ok": false, "errorCode": "INTRAPAY_XXX", "message": "Mensagem amigável", "details": { } }
```
- Sucesso: `ok: true` com dados da operação.

## Validação de Webhooks
- Se a doc definir assinatura/segredo, use `INTRAPAY_WEBHOOK_SECRET` e valide HMAC no endpoint consumidor.
- Exemplo de endpoint consumidor (Node/Express):
```ts
import crypto from 'crypto';
import express from 'express';
const app = express();
app.use(express.json());
app.post('/webhooks/intrapay', (req, res) => {
  const secret = process.env.INTRAPAY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-intrapay-signature'] as string;
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signature !== expected) return res.status(401).end();
  res.status(200).end();
});
```

## Testes
- `npm run test`
- Testes cobrem validação Zod dos tools e client com respostas mockadas.

## Scripts
- `dev`: roda o servidor MCP em desenvolvimento
- `build`: build com `tsup`
- `start`: executa o build
- `test`: roda Vitest

## Deploy
- Vercel/Render/Fly.io
- Considere revalidar token em execuções frias.
- Configure allowlist de IP no dashboard da Intra Pay.