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
  status?: number;
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
  return { ok: false, errorCode, message: message || 'Erro na API Intra Pay', status, details };
};