import client from './client';
import {
  SubscriptionPlan,
  CurrentSubscription,
  PaymentInitResponse,
  PaymentVerifyResponse,
} from '../types/subscription';

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const res = await client.get('/auth/subscription/plans/');
  return res.data;
};

export const getCurrentSubscription = async (): Promise<CurrentSubscription> => {
  const res = await client.get('/auth/subscription/current/');
  return res.data;
};

export const initializePayment = async (plan: string): Promise<PaymentInitResponse> => {
  const res = await client.post('/auth/subscription/initialize/', { plan });
  return res.data;
};

export const verifyPayment = async (transactionId: string, txRef: string): Promise<PaymentVerifyResponse> => {
  const res = await client.post('/auth/subscription/verify/', {
    transaction_id: transactionId,
    tx_ref: txRef,
  });
  return res.data;
};
