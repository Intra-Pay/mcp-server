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

*   Node.js 20 ou superior.

## Instalação e Configuração

O servidor MCP da Intra Pay funciona exclusivamente em **Produção** e se conecta automaticamente à API oficial (`api.intrapay.io`).

Você só precisa fornecer suas credenciais (`client-key` e `client-secret`).

### Opção 1: Configuração via Cliente MCP (Recomendado)

Esta opção é ideal para rodar localmente sem precisar criar arquivos de configuração no servidor. As credenciais ficam salvas apenas na configuração do seu cliente MCP.

#### Claude Desktop

Adicione a configuração ao seu arquivo `claude_desktop_config.json`:

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

#### Argumentos Disponíveis

| Argumento | Variável de Ambiente | Descrição | Obrigatório |
| :--- | :--- | :--- | :--- |
| `--client-key` | `INTRAPAY_CLIENT_KEY` | Sua chave de cliente Intra Pay | Sim |
| `--client-secret` | `INTRAPAY_CLIENT_SECRET` | Seu segredo de cliente Intra Pay | Sim |
| `--port` | `PORT` | Porta do servidor (padrão: 4000) | Não |
| `--webhook-secret` | `INTRAPAY_WEBHOOK_SECRET` | Segredo para validação de webhooks | Não |

### Opção 2: Configuração via Arquivo .env

Ideal para deploy em servidores ou se preferir não passar credenciais via CLI.

1.  Clone o repositório e instale as dependências:
    ```bash
    npm install
    ```
2.  Copie o arquivo de exemplo:
    ```bash
    cp .env.example .env
    ```
3.  Preencha o arquivo `.env` com suas credenciais:
    ```env
    INTRAPAY_CLIENT_KEY=sua_chave
    INTRAPAY_CLIENT_SECRET=seu_segredo
    PORT=4000
    ```

## Execução

### Desenvolvimento
```bash
npm run dev
# Ou passando argumentos:
npx tsx src/mcp/server.ts --client-key=...
```

### Produção (Build)
```bash
npm run build
npm start
```

## Conectando com Outros Clientes

### VS Code (Extensão MCP)
Execute no terminal (substitua a URL se estiver usando o servidor hospedado):
```bash
code --add-mcp "{\"name\":\"intrapay\",\"type\":\"http\",\"url\":\"https://mcp.intrapay.io/mcp\"}"
```

### Trae (Windows)
Edite o arquivo `C:\Users\<seu-usuario>\AppData\Roaming\Trae\User\mcp.json`:

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

### Cursor
1.  Vá em **Settings** > **MCP** > **Add Server**.
2.  Selecione transporte **HTTP**.
3.  URL: `https://mcp.intrapay.io/mcp` (Servidor Oficial) ou `http://localhost:4000/mcp` (Local).

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

Para deploy em produção, recomenda-se o uso de variáveis de ambiente.

1.  Crie um projeto na Railway/Vercel conectado a este repositório.
2.  Configure as variáveis de ambiente (`INTRAPAY_CLIENT_KEY`, `INTRAPAY_CLIENT_SECRET`) no painel do provedor.
3.  O comando de inicialização é `npm start`.
4.  A porta será definida automaticamente pela variável `PORT` fornecida pela plataforma.

## Segurança

*   **Credenciais**: Nunca commite suas chaves ou arquivo `.env`. Use a configuração via argumentos CLI no cliente MCP para maior segurança local.
*   **Logs**: O sistema evita logar informações sensíveis, mas registra metadados de transações (`txid`) para auditoria.
*   **IP Allowlist**: Lembre-se de autorizar o IP do servidor (ou da sua máquina) no painel da Intra Pay.

## Licença

Este projeto é de uso livre para integração com a API da Intra Pay.
