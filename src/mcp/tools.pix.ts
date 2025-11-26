import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { intrapayClient } from '../intrapay/client';
import { buildSuccess, normalizeIntraPayError } from '../utils/errors.js';

export const StaticInput = {
  amount: z.number(),
  description: z.string(),
  txid: z.string().optional(),
  payerName: z.string().optional(),
  payerDocument: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
};

export const StaticOutput = {
  txid: z.string(),
  brCode: z.string(),
  qrCodeImage: z.string().optional(),
  status: z.string(),
  rawResponse: z.any(),
};

export const DynamicImmediateInput = {
  amount: z.number(),
  description: z.string(),
  payerName: z.string().optional(),
  payerDocument: z.string().optional(),
  additionalInfo: z.record(z.string(), z.unknown()).optional(),
};

export const DynamicOutput = {
  txid: z.string(),
  location: z.string().optional(),
  brCode: z.string(),
  status: z.string(),
  rawResponse: z.any(),
};

export const DynamicDuedateInput = {
  amount: z.number(),
  description: z.string(),
  dueDate: z.string(),
  payerName: z.string().optional(),
  payerDocument: z.string().optional(),
  additionalInfo: z.record(z.string(), z.unknown()).optional(),
};

export const StatusInput = { txid: z.string() };
export const StatusOutput = { status: z.string(), amount: z.number(), paidAt: z.string().optional(), rawResponse: z.any() };

export const CashOutAccountInput = {
  amount: z.number(),
  bankCode: z.string(),
  branch: z.string(),
  accountNumber: z.string(),
  accountType: z.string(),
  accountHolderName: z.string(),
  accountHolderDocument: z.string(),
  description: z.string().optional(),
};

export const CashOutOutput = { transactionId: z.string().optional(), status: z.string(), rawResponse: z.any() };

export const CashOutKeyInput = { amount: z.number(), pixKey: z.string(), description: z.string().optional(), metadata: z.record(z.string(), z.unknown()).optional() };

export const CashOutEmvInput = { amount: z.number(), emv: z.string() };

export const registerPixTools = (server: McpServer) => {
  server.registerTool(
    'intrapay_pix_create_static_qrcode',
    { title: 'Pix Estático', description: 'Gera cobrança Pix estática', inputSchema: StaticInput, outputSchema: StaticOutput },
    async (args) => {
      const pixKeyId = (args.metadata?.pixKeyId as string) || '';
      if (!pixKeyId) {
        const err = normalizeIntraPayError(400, { reason: 'pixKeyId ausente em metadata' }, 'Parâmetro obrigatório ausente');
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
      const res = await intrapayClient.createStaticQRCode({ pixKeyId, amount: args.amount, additionalInformation: args.description, description: args.description });
      const data = { txid: res.transactionIdentification, brCode: res.emvqrcps, status: res.status, rawResponse: res };
      const output = buildSuccess(data);
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );

  server.registerTool(
    'intrapay_pix_create_dynamic_immediate_qrcode',
    { title: 'Pix Dinâmico Imediato', description: 'Gera cobrança Pix dinâmica imediata', inputSchema: DynamicImmediateInput, outputSchema: DynamicOutput },
    async (args) => {
      const pixKeyId = (args.additionalInfo?.pixKeyId as string) || '';
      if (!pixKeyId) {
        const err = normalizeIntraPayError(400, { reason: 'pixKeyId ausente em additionalInfo' }, 'Parâmetro obrigatório ausente');
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
      const res = await intrapayClient.createDynamicImmediateQRCode({ pixKeyId, amount: args.amount });
      const output = buildSuccess({ txid: res.transactionIdentification, brCode: res.emvqrcps, status: res.status, rawResponse: res });
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );

  server.registerTool(
    'intrapay_pix_create_dynamic_duedate_qrcode',
    { title: 'Pix Dinâmico com Vencimento', description: 'Gera cobrança Pix dinâmica com vencimento', inputSchema: DynamicDuedateInput, outputSchema: DynamicOutput },
    async (args) => {
      const pixKeyId = (args.additionalInfo?.pixKeyId as string) || '';
      if (!pixKeyId) {
        const err = normalizeIntraPayError(400, { reason: 'pixKeyId ausente em additionalInfo' }, 'Parâmetro obrigatório ausente');
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
      const res = await intrapayClient.createDynamicDuedateQRCode({ pixKeyId, amount: args.amount, duedate: args.dueDate, debtor: { name: '' } });
      const output = buildSuccess({ txid: res.transactionIdentification, brCode: res.emvqrcps, status: res.status, rawResponse: res });
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );

  server.registerTool(
    'intrapay_pix_get_charge_status',
    { title: 'Status de Cobrança Pix', description: 'Consulta status da cobrança por txid', inputSchema: StatusInput, outputSchema: StatusOutput },
    async (args) => {
      try {
        const res = await intrapayClient.getPixChargeStatus(args.txid);
        const output = buildSuccess({ status: res.status, amount: res.amount, paidAt: res.paidAt, rawResponse: res.rawResponse });
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
      } catch (e) {
        const err = normalizeIntraPayError((e as any).httpStatus || 501, { txid: args.txid }, 'Consulta de status não implementada');
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
    }
  );

  server.registerTool(
    'intrapay_pix_cash_out_by_account',
    { title: 'Pix Cash Out por Conta', description: 'Efetua pagamento por conta bancária', inputSchema: CashOutAccountInput, outputSchema: CashOutOutput },
    async (args) => {
      const res = await intrapayClient.pixCashOutByAccount({
        account: args.accountNumber,
        branch: args.branch,
        bank: args.bankCode,
        amount: args.amount,
        taxId: args.accountHolderDocument,
        name: args.accountHolderName,
        accountType: args.accountType as any,
        description: args.description,
      });
      const output = buildSuccess({ transactionId: res.endToEndId, status: res.status, rawResponse: res });
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );

  server.registerTool(
    'intrapay_pix_cash_out_by_key',
    { title: 'Pix Cash Out por Chave', description: 'Efetua pagamento via chave Pix', inputSchema: CashOutKeyInput, outputSchema: CashOutOutput },
    async (args) => {
      const m = args.metadata || {};
      if (!m['endtoEndId'] || !m['account'] || !m['owner']) {
        const err = normalizeIntraPayError(400, { reason: 'endtoEndId/account/owner ausentes em metadata' }, 'Parâmetros obrigatórios ausentes');
        return { content: [{ type: 'text', text: JSON.stringify(err) }], structuredContent: err };
      }
      const res = await intrapayClient.pixCashOutByKey({
        key: args.pixKey,
        keyType: 'EVP',
        endtoEndId: String(m['endtoEndId']),
        account: m['account'] as any,
        owner: m['owner'] as any,
        amount: args.amount,
        description: args.description,
      });
      const output = buildSuccess({ transactionId: res.endToEndId, status: res.status, rawResponse: res });
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );

  server.registerTool(
    'intrapay_pix_cash_out_by_emv',
    { title: 'Pix Cash Out por EMV', description: 'Efetua pagamento via EMV (QR Code)', inputSchema: CashOutEmvInput, outputSchema: CashOutOutput },
    async (args) => {
      const res = await intrapayClient.pixCashOutByEmv({ emv: args.emv, amount: { final: args.amount } });
      const output = buildSuccess({ transactionId: res.endToEndId, status: res.status, rawResponse: res });
      return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
  );
};