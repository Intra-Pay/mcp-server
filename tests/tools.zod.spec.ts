import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import {
  StaticInput,
  DynamicImmediateInput,
  DynamicDuedateInput,
  StatusInput,
  CashOutAccountInput,
  CashOutKeyInput,
  CashOutEmvInput,
} from '../src/mcp/tools.pix';

describe('Zod schemas', () => {
  it('validates static qrcode input', () => {
    const Schema = z.object(StaticInput);
    const parsed = Schema.safeParse({ amount: 150.5, description: 'Pagamento', metadata: { pixKeyId: 'uuid' } });
    expect(parsed.success).toBe(true);
  });

  it('rejects static qrcode missing amount', () => {
    const Schema = z.object(StaticInput);
    const parsed = Schema.safeParse({ description: 'Pagamento' });
    expect(parsed.success).toBe(false);
  });

  it('validates dynamic immediate input', () => {
    const Schema = z.object(DynamicImmediateInput);
    const parsed = Schema.safeParse({ amount: 10, description: 'Serviço', additionalInfo: { pixKeyId: 'uuid' } });
    expect(parsed.success).toBe(true);
  });

  it('validates dynamic duedate input', () => {
    const Schema = z.object(DynamicDuedateInput);
    const parsed = Schema.safeParse({ amount: 10, description: 'Serviço', dueDate: '2025-12-31', additionalInfo: { pixKeyId: 'uuid' } });
    expect(parsed.success).toBe(true);
  });

  it('validates status input', () => {
    const Schema = z.object(StatusInput);
    const parsed = Schema.safeParse({ txid: 'E123' });
    expect(parsed.success).toBe(true);
  });

  it('validates cash out by account input', () => {
    const Schema = z.object(CashOutAccountInput);
    const parsed = Schema.safeParse({ amount: 25, bankCode: '99999999', branch: '0001', accountNumber: '12345678', accountType: 'CACC', accountHolderName: 'João', accountHolderDocument: '12345678909' });
    expect(parsed.success).toBe(true);
  });

  it('validates cash out by key input', () => {
    const Schema = z.object(CashOutKeyInput);
    const parsed = Schema.safeParse({ amount: 25, pixKey: 'uuid', metadata: { endtoEndId: 'E123', account: { participant: '123', accountType: 'CACC', branch: '0001', account: '123' }, owner: { name: 'Maria', type: 'NATURAL_PERSON', documentNumber: '123' } } });
    expect(parsed.success).toBe(true);
  });

  it('validates cash out by emv input', () => {
    const Schema = z.object(CashOutEmvInput);
    const parsed = Schema.safeParse({ amount: 2500, emv: '0002012658...' });
    expect(parsed.success).toBe(true);
  });
});