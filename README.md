# Intra Pay MCP Server

**Servidor MCP 100% em Português**, focado em DX, que expõe operações Pix (cash-in/cash-out) e webhooks da Intra Pay para agentes/IDEs (Claude Desktop, Cursor, OpenAI Agents, etc.). Inclui client HTTP tipado, schemas com Zod e resposta padronizada (`ok`/`result`).

## Requisitos
- Node.js 20+

## Configuração (Local)
- `npm install`
- `cp .env.example .env`
- Preencha `INTRAPAY_BASE_URL`, `INTRAPAY_CLIENT_KEY`, `INTRAPAY_CLIENT_SECRET`, `INTRAPAY_ENV`, `PORT`.
- No dashboard da Intra Pay, habilite allowlist de IP para chamadas da API.

## Execução (Local)
- `npm run dev`
- MCP HTTP: `POST http://localhost:4000/mcp`
- Health: `GET http://localhost:4000/health`

## Formato de Resposta
- Sucesso: `{ ok: true, result: "success", data: { ... } }`
- Erro: `{ ok: false, result: "error", errorCode, message, httpStatus?, details }`

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
- MCP Inspector: `npx @modelcontextprotocol/inspector` e conectar `http://localhost:4000/mcp`

## Uso Programático (MCP Client)
```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({ url: 'http://localhost:4000/mcp' });
const client = new Client({ name: 'agent', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

await client.request({ method: 'tools/list' });

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
- QR Code estático: `Use intrapay_pix_create_static_qrcode com amount=150.00, description="Serviço", metadata.pixKeyId="<uuid-da-chave>".`
- QR dinâmico imediato: `Use intrapay_pix_create_dynamic_immediate_qrcode com amount=240.00, description="Serviço", additionalInfo.pixKeyId="<uuid>".`
- QR com vencimento: `Use intrapay_pix_create_dynamic_duedate_qrcode com amount=150.75, description="Consultoria", dueDate="2025-12-31", additionalInfo.pixKeyId="<uuid>".`
- Status pagamento: `Use intrapay_pix_get_charge_status com txid="E87452H20251024001".` (retorna NOT_IMPLEMENTED se o endpoint não existir).
- Cash-out por chave: `Use intrapay_pix_cash_out_by_key com amount=25, pixKey="<EVP>", description="Pagamento" e metadata.endtoEndId/account/owner.`
- Cash-out por EMV: `Use intrapay_pix_cash_out_by_emv com amount=2500 e emv="<payload EMV>".`
- Webhooks: `Use intrapay_webhook_create com url="https://meuapp/webhooks/intrapay" e events=["pix-payment-in"].` e `intrapay_webhook_list`.

## Contratos da Intra Pay
- Autenticação: `POST /api/financial/v1/auth/token` → `{ clientToken, expiresIn }` (Bearer 15 min; exige allowlist de IP).
- Pix Estático: `{ pixKeyId, amount, additionalInformation? }` → EMV + `transactionIdentification`.
- Pix Dinâmico Imediato: `{ pixKeyId, amount, additionalInformation?, debtor?, payerQuestion?, expiration? }`.
- Pix Dinâmico com Vencimento: `POST /api/financial/v1/pix-cash-in/duedate` com `debtor`, descontos, juros/multa, `duedate` futura.
- Cash Out por Conta: `{ account, branch, bank, amount, taxId, name, accountType, description?, password? }`.
- Cash Out por Chave: `{ key, keyType, endtoEndId, account, owner, amount?, description? }`.
- Cash Out por EMV: pagamento via QR/EMV com duas etapas.

### Observações de Endpoints
- Confirmados: `POST /api/financial/v1/auth/token`, `POST /api/financial/v1/pix-cash-in/duedate`.
- Ajustáveis: editar `PATHS` em `src/intrapay/client.ts:24` se a doc oficial usar caminhos diferentes.

## Segurança e Logs
- Não logar segredos (clientSecret, etc.).
- Logs incluem método, endpoint, status, `txid`/`transactionId`.
- Erros padronizados para DX em agentes.

## Validação de Webhooks
- Se houver assinatura/segredo, usar `INTRAPAY_WEBHOOK_SECRET`; exemplo de verificação com HMAC incluído.

## Testes
- `npm run test` executa validações de Zod e client com mocks.

## Scripts
- `dev`: servidor MCP em desenvolvimento
- `build`: build com `tsup`
- `start`: inicia servidor do build
- `test`: Vitest

## Deploy na Railway (Passo a Passo)
- Pré-requisitos: conta na Railway e acesso ao repositório GitHub.
- Passos:
  - Crie um novo projeto na Railway e conecte ao repositório `Intra-Pay/mcp-server`.
  - Em Variables, configure:
    - `INTRAPAY_BASE_URL=https://api.intrapay.io`
    - `INTRAPAY_CLIENT_KEY=...`
    - `INTRAPAY_CLIENT_SECRET=...`
    - `INTRAPAY_ENV=sandbox` ou `production`
    - `INTRAPAY_WEBHOOK_SECRET` (opcional)
  - Start command: `npm start`.
  - A Railway define `PORT` automaticamente; o servidor usa esse valor.
  - O build ocorre no `postinstall` (`npm run build`), já configurado no `package.json`.
  - Após o deploy, o MCP ficará disponível em `POST https://<seu-domínio>/mcp` e health em `GET https://<seu-domínio>/health`.

### Dicas de Produção
- Revise políticas de retry (já implementadas) e monitore logs.
- Garanta allowlist de IP no dashboard da Intra Pay.
- Use `mcp.json` para discovery dos tools em clientes MCP.