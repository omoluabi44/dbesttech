import client from './client';

export interface PaymentMetrics {
  revenue: number;
  volume: number;
  success_rate: number;
  settlement: number;
  successful_count: number;
  failed_count: number;
  pending_count: number;
}

export interface Transaction {
  id: number;
  tx_ref: string;
  flw_transaction_id: string;
  customer_email: string;
  customer_name: string;
  amount: string;
  currency: string;
  plan: string;
  payment_type: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  created_at: string;
  verified_at: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WebhookLog {
  id: number;
  event: string;
  payload: any;
  tx_ref: string;
  flw_transaction_id: string;
  status: 'processed' | 'ignored' | 'error';
  discrepancy: boolean;
  discrepancy_detail: string;
  created_at: string;
}

export interface RequeryResult {
  message: string;
  old_status: string;
  new_status: string;
  gateway_status: string;
  gateway_amount: number;
  gateway_currency: string;
}

export const getPaymentMetrics = async (range: string): Promise<PaymentMetrics> => {
  const res = await client.get(`/auth/admin-payments/metrics/?range=${range}`);
  return res.data;
};

export const getTransactions = async (params: {
  search?: string;
  status?: string;
  channel?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Transaction>> => {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.channel) searchParams.set('channel', params.channel);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.page_size) searchParams.set('page_size', String(params.page_size));
  const res = await client.get(`/auth/admin-payments/transactions/?${searchParams.toString()}`);
  return res.data;
};

export const requeryTransaction = async (txRef: string): Promise<RequeryResult> => {
  const res = await client.post(`/auth/admin-payments/transactions/${txRef}/requery/`);
  return res.data;
};

export const refundTransaction = async (txRef: string, amount?: number): Promise<any> => {
  const body = amount ? { amount } : {};
  const res = await client.post(`/auth/admin-payments/transactions/${txRef}/refund/`, body);
  return res.data;
};

export const getWebhookLogs = async (params: {
  page?: number;
  page_size?: number;
  discrepancy_only?: boolean;
}): Promise<PaginatedResponse<WebhookLog>> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.page_size) searchParams.set('page_size', String(params.page_size));
  if (params.discrepancy_only) searchParams.set('discrepancy_only', 'true');
  const res = await client.get(`/auth/admin-payments/webhooks/?${searchParams.toString()}`);
  return res.data;
};
