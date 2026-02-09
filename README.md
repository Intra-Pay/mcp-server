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

### Autenticação Multi-Tenant (Suporte a Múltiplos Clientes)

Este servidor suporta autenticação por requisição. Isso permite que uma única instância hospedada (`https://mcp.intrapay.io/mcp`) atenda a múltiplos clientes, cada um com suas próprias credenciais.

Para isso, o cliente MCP deve enviar as credenciais através dos Headers HTTP:
*   `x-intrapay-client-key`: Sua Client Key
*   `x-intrapay-client-secret`: Seu Client Secret

*Se os headers não forem enviados, o servidor usará as credenciais padrão configuradas no ambiente.*

---

### Configuração Remota (Recomendado)

#### Trae (Windows/Mac)
Edite o arquivo de configuração (Windows: `%APPDATA%\Trae\User\mcp.json`):

```json
{
  "servers": {
    "intrapay": {
      "type": "http",
      "url": "https://mcp.intrapay.io/mcp",
      "headers": {
        "x-intrapay-client-key": "SUA_CLIENT_KEY",
        "x-intrapay-client-secret": "SEU_CLIENT_SECRET"
      },
      "metadata": {
        "name": "intrapay-mcp",
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
*Nota: O Cursor pode não ter interface gráfica para adicionar headers customizados ainda. Se for o caso, use a configuração local ou verifique a documentação atualizada do Cursor.*

---

### Configuração Local (Avançado)

Use esta opção se precisar usar **suas próprias credenciais** Intra Pay.

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

# Rodar com suas credenciais
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

Se quiser hospedar sua própria instância com suas chaves:

1.  Crie um projeto na Railway/Vercel conectado a este repositório.
2.  Configure as variáveis de ambiente (`INTRAPAY_CLIENT_KEY`, `INTRAPAY_CLIENT_SECRET`) no painel do provedor.
3.  O comando de inicialização é `npm start`.

## Segurança

*   **Credenciais**: Nunca commite suas chaves ou arquivo `.env`.
*   **Logs**: O sistema evita logar informações sensíveis, mas registra metadados de transações (`txid`) para auditoria.

## Licença

Este projeto é de uso livre para integração com a API da Intra Pay.
