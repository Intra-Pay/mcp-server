# Servidor MCP Intra Pay

**Servidor MCP 100% em Português**, focado na experiência de desenvolvimento (DX), que expõe operações Pix (cash-in/cash-out) e webhooks da Intra Pay para agentes e IDEs compatíveis com o Model Context Protocol (MCP), como Claude Desktop, Cursor, Trae e OpenAI Agents.

Este projeto inclui um cliente HTTP tipado, schemas validados com Zod e respostas padronizadas.

## Funcionalidades

*   **Autenticação**: Gerenciamento automático de tokens com cache.
*   **Pix Cash-In**: Criação de QR Codes estáticos, dinâmicos imediatos e com vencimento.
*   **Pix Cash-Out**: Pagamentos por chave Pix, dados bancários ou leitura de QR Code (EMV).
*   **Webhooks**: Criação e listagem de webhooks para notificação de eventos.
*   **Consultas**: Verificação de status de cobranças (onde suportado).

## Requisitos

*   Node.js 20 ou superior (apenas se for rodar localmente).

## Instalação e Configuração

O servidor MCP da Intra Pay funciona exclusivamente em **Produção** (`api.intrapay.io`).
Para conectar, você só precisa fornecer suas credenciais (`client-key` e `client-secret`) no provedor do servidor, não no cliente MCP.

### Configuração Remota (Recomendado)

O servidor oficial já está hospedado e pronto para uso em: `https://mcp.intrapay.io/mcp`

#### Trae (Windows/Mac)
Edite o arquivo de configuração (Windows: `%APPDATA%\Trae\User\mcp.json`):

```json
{
  "servers": {
    "intrapay": {
      "type": "http",
      "url": "https://mcp.intrapay.io/mcp",
      "metadata": {
        "name": "intrapay-mcp",
        "version": "1.0.0",
        "description": "MCP server para operações Pix via Intra Pay"
      }
    }
  }
}
```

#### Cursor
1.  Vá em **Settings** > **MCP** > **Add Server**.
2.  Selecione transporte **HTTP** (ou SSE).
3.  URL: `https://mcp.intrapay.io/mcp`
4.  Nome: `intrapay`

---

### Configuração Local (Avançado)

Use esta opção apenas se precisar rodar o servidor na sua própria máquina (ex: para desenvolvimento ou se o cliente MCP não suportar SSE remoto).

#### Claude Desktop (Local)

Adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "intrapay": {
      "command": "node",
      "args": [
        "C:\\Caminho\\Para\\mcp-server\\dist\\server.js",
        "--client-key=SUA_KEY_PRODUCAO",
        "--client-secret=SEU_SECRET_PRODUCAO"
      ]
    }
  }
}
```

#### Executando Manualmente
```bash
# Instalar dependências
npm install

# Build
npm run build

# Rodar
node dist/server.js --client-key=SUA_KEY --client-secret=SEU_SECRET
```

## Tools Disponíveis

O servidor expõe as seguintes ferramentas para o agente:

*   `intrapay_health_check`: Verifica o status da conexão.
*   `intrapay_pix_create_static_qrcode`: Gera um QR Code Pix estático.
*   `intrapay_pix_create_dynamic_immediate_qrcode`: Gera um Pix dinâmico para pagamento imediato.
*   `intrapay_pix_create_dynamic_duedate_qrcode`: Gera um Pix dinâmico com data de vencimento.
*   `intrapay_pix_get_charge_status`: Consulta o status de uma cobrança.
*   `intrapay_pix_cash_out_by_account`: Realiza transferência Pix para conta bancária.
*   `intrapay_pix_cash_out_by_key`: Realiza transferência Pix via chave (CPF, Email, etc.).
*   `intrapay_pix_cash_out_by_emv`: Realiza pagamento lendo um código "Copia e Cola" (EMV).
*   `intrapay_webhook_create`: Registra um novo webhook.
*   `intrapay_webhook_list`: Lista os webhooks cadastrados.

## Deploy na Nuvem (Railway/Vercel)

Se quiser hospedar sua própria instância:

1.  Crie um projeto na Railway/Vercel conectado a este repositório.
2.  Configure as variáveis de ambiente (`INTRAPAY_CLIENT_KEY`, `INTRAPAY_CLIENT_SECRET`) no painel do provedor.
3.  O comando de inicialização é `npm start`.

## Segurança

*   **Credenciais**: Nunca commite suas chaves ou arquivo `.env`.
*   **Logs**: O sistema evita logar informações sensíveis, mas registra metadados de transações (`txid`) para auditoria.

## Licença

Este projeto é de uso livre para integração com a API da Intra Pay.
