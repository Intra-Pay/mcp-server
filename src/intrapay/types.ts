export interface AuthResponse {
  clientToken: string;
  expiresIn: number;
}

export interface CreateStaticPixRequest {
  pixKeyId: string;
  amount: number;
  additionalInformation?: string;
  description?: string;
}

export interface CreateStaticPixResponse {
  id: string;
  amount: number;
  status: string;
  pixKey: string;
  pixKeyId: string;
  type: string;
  emvqrcps: string;
  transactionId: number;
  transactionIdentification: string;
  description?: string;
  createdAt: string;
}

export interface AdditionalInfoItem {
  name: string;
  value: string;
}

export interface DebtorInfo {
  name: string;
  taxId?: string;
  cpf?: string;
  city?: string;
  publicArea?: string;
  state?: string;
  postalCode?: string;
  email?: string;
}

export interface ExpirationInfo {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface CreateDynamicImmediatePixRequest {
  pixKeyId: string;
  amount: number;
  additionalInformation?: AdditionalInfoItem[];
  debtor?: DebtorInfo;
  payerQuestion?: string;
  expiration?: ExpirationInfo;
}

export interface CreateDynamicImmediatePixResponse extends CreateStaticPixResponse {
  expiresAt?: string;
}

export interface AmountRuleFixedPerc {
  modality: string;
  amountPerc?: number;
}

export interface AmountDiscountFixedDates {
  modality: string;
  discountDateFixed?: Array<{ date: string; amountPerc: number }>;
}

export interface CreateDynamicDuedatePixRequest {
  pixKeyId: string;
  amount: number;
  duedate: string;
  expirationAfterPayment?: number;
  debtor: DebtorInfo;
  payerQuestion?: string;
  amountDiscount?: AmountDiscountFixedDates;
  amountAbatement?: AmountRuleFixedPerc;
  amountFine?: AmountRuleFixedPerc;
  amountInterest?: AmountRuleFixedPerc;
  additionalInformation?: AdditionalInfoItem[];
}

export interface CreateDynamicDuedatePixResponse extends CreateStaticPixResponse {
  dueDate: string;
  expiresAt?: string;
}

export interface GetPixStatusResponse {
  status: string;
  amount: number;
  paidAt?: string;
  rawResponse?: unknown;
}

export type AccountType = 'CACC' | 'TRAN' | 'SLRY' | 'SVGS';

export interface PixCashOutByAccountRequest {
  account: string;
  branch: string;
  bank: string;
  amount: number;
  taxId: string;
  name: string;
  accountType: AccountType;
  description?: string;
  password?: string;
}

export interface AccountParticipantInfo {
  participant: string;
  accountType: AccountType;
  branch: string;
  account: string;
}

export interface OwnerInfo {
  name: string;
  type: 'NATURAL_PERSON' | 'LEGAL_PERSON';
  tradeName?: string;
  documentNumber: string;
}

export interface PixCashOutByKeyRequest {
  key: string;
  keyType: 'EVP' | 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE';
  endtoEndId: string;
  account: AccountParticipantInfo;
  owner: OwnerInfo;
  amount?: number;
  description?: string;
}

export interface PixCashOutByEmvRequest {
  type?: 'STATIC_QRCODE' | 'IMMEDIATE_QRCODE' | 'DUEDATE_QRCODE';
  endToEndId?: string;
  payerQuestion?: string;
  additionalInfo?: Array<{ key: string; value: string }>;
  amount?: {
    original?: number;
    final?: number;
    abatement?: number;
    discount?: number;
    interest?: number;
    fine?: number;
    canModifyFinalAmount?: boolean;
  };
  receiver?: { name: string; participant: string; documentNumber: string };
  debtor?: { name: string; documentNumber: string };
  calendar?: { expirationDate: string };
  emv?: string;
}

export interface PixCashOutResponse {
  id?: string;
  endToEndId?: string;
  amount: number;
  fee?: number;
  status: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  secret?: string;
}

export interface CreateWebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface ListWebhooksResponse {
  webhooks: Array<{ id: string; url: string; events: string[]; active: boolean }>;
}