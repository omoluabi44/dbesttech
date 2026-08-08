export interface SubscriptionPlan {
  name: string;
  display_name: string;
  price: number;
  currency: string;
  features: string[];
  is_featured: boolean;
  start_date?: string;
  end_date?: string;
}

export interface CurrentSubscription {
  plan: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
}

export interface PaymentInitResponse {
  tx_ref: string;
  amount: number;
  currency: string;
  public_key: string;
}

export interface PaymentVerifyResponse {
  message: string;
  plan: string;
  status: string;
  end_date: string;
}
