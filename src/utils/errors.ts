export type IntraPayErrorCode =
  | 'INTRAPAY_AUTH_ERROR'
  | 'INTRAPAY_VALIDATION_ERROR'
  | 'INTRAPAY_FORBIDDEN'
  | 'INTRAPAY_NOT_FOUND'
  | 'INTRAPAY_UNPROCESSABLE'
  | 'INTRAPAY_SERVER_ERROR'
  | 'INTRAPAY_NOT_IMPLEMENTED'
  | 'UNKNOWN_ERROR';

export interface IntraPayError {
  ok: false;
  errorCode: IntraPayErrorCode;
  message: string;
  httpStatus?: number;
  result: 'error';
  details?: unknown;
}

export const normalizeIntraPayError = (
  status: number,
  details?: unknown,
  message?: string
): IntraPayError => {
  let errorCode: IntraPayErrorCode = 'UNKNOWN_ERROR';
  if (status === 400) errorCode = 'INTRAPAY_VALIDATION_ERROR';
  else if (status === 401) errorCode = 'INTRAPAY_AUTH_ERROR';
  else if (status === 403) errorCode = 'INTRAPAY_FORBIDDEN';
  else if (status === 404) errorCode = 'INTRAPAY_NOT_FOUND';
  else if (status === 422) errorCode = 'INTRAPAY_UNPROCESSABLE';
  else if (status >= 500) errorCode = 'INTRAPAY_SERVER_ERROR';
  return { ok: false, result: 'error', errorCode, message: message || 'Erro na API Intra Pay', httpStatus: status, details };
};

export class MCPError extends Error {
  code: IntraPayErrorCode;
  httpStatus?: number;
  details?: unknown;
  constructor(message: string, code: IntraPayErrorCode = 'UNKNOWN_ERROR', httpStatus?: number, details?: unknown) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
  toJSON(): IntraPayError {
    return {
      ok: false,
      result: 'error',
      errorCode: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      details: this.details,
    };
  }
}

export const buildSuccess = <T>(data: T): { ok: true; result: 'success'; data: T } => ({ ok: true, result: 'success', data });