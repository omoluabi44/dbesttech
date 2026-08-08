'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, PartyPopper, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { getPlans, getCurrentSubscription, initializePayment, verifyPayment } from '@/lib/api/subscription';
import { getProfile } from '@/lib/api/auth';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { PlanCard } from '@/components/subscription/PlanCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planName: string) => void;
}

export function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  const { user, updateUser } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    planName: string;
    endDate: string | null;
  } | null>(null);

  // Robustly close the Flutterwave modal and restore page interactivity
  const closeFlutterwaveModal = useCallback(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      if (
        iframe.getAttribute('name') === 'checkout' ||
        iframe.src?.includes('flutterwave') ||
        iframe.src?.includes('checkout')
      ) {
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '-1';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        setTimeout(() => {
          try { iframe.remove(); } catch (e) { /* ignore */ }
        }, 100);
      }
    });

    const allDivs = document.querySelectorAll('div');
    allDivs.forEach((div) => {
      const style = window.getComputedStyle(div);
      if (
        style.position === 'fixed' &&
        style.zIndex &&
        parseInt(style.zIndex) > 9999 &&
        div.id !== '__next'
      ) {
        div.style.display = 'none';
        setTimeout(() => {
          try { div.remove(); } catch (e) { /* ignore */ }
        }, 100);
      }
    });

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }, []);

  const refreshSubscriptionState = useCallback(async () => {
    try {
      const subRes = await getCurrentSubscription();
      const plan = (subRes as any).subscription_plan || (subRes as any).plan || 'free';
      setCurrentPlan(plan);
    } catch (e) {
      console.error('Error refreshing subscription:', e);
    }
    try {
      const profileRes = await getProfile();
      updateUser(profileRes);
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, [updateUser]);

  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        try { document.body.removeChild(script); } catch (e) { /* ignore */ }
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state if modal closes
      if (!successInfo) {
        setProcessingPlan(null);
      }
      return;
    }
    
    const fetchData = async () => {
      try {
        const plansData = await getPlans();
        const finalPlans = plansData && plansData.length > 0 ? plansData : [
          {
            id: 'free',
            name: 'free',
            display_name: 'Free',
            price: 0,
            currency: 'NGN',
            features: ['Access to the first 10 questions of Easy level only'],
            is_featured: false
          },
          {
            id: 'monthly',
            name: 'monthly',
            display_name: 'Monthly',
            price: 1000,
            currency: 'NGN',
            features: [
              'Unlimited access to all questions',
              'Detailed step-by-step explanations',
              'Full performance analytics',
              'AI-powered study suggestions',
              'Priority support'
            ],
            is_featured: true
          }
        ];
        
        setPlans(finalPlans as any);
        
        const currentSub = await getCurrentSubscription().catch(() => ({ plan: 'free', status: 'active', start_date: null, end_date: null }));
        setCurrentPlan((currentSub as any).subscription_plan || (currentSub as any).plan || 'free');
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription plans.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, successInfo]);

  const handlePayment = async (planName: string) => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    setProcessingPlan(planName);
    try {
      const paymentData = await initializePayment(planName);
      
      const config = {
        public_key: paymentData.public_key,
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
        },
        customizations: {
          title: 'DBestQuiz Subscription',
          description: `Upgrade to ${planName} plan`,
          logo: '',
        },
        callback: async (response: any) => {
          closeFlutterwaveModal();
          setProcessingPlan('verifying');

          try {
            const txId = response.transaction_id || response.id;
            const verifyRes = await verifyPayment(
              String(txId),
              response.tx_ref
            );

            const verifiedPlan = (verifyRes as any).plan || planName;
            const verifiedEndDate = (verifyRes as any).end_date || null;

            setCurrentPlan(verifiedPlan);
            setSuccessInfo({
              planName: verifiedPlan,
              endDate: verifiedEndDate,
            });
            toast.success('🎉 Subscription activated! Enjoy your new plan!');

            await refreshSubscriptionState();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setProcessingPlan(null);
          }
        },
        onclose: () => {
          if (!successInfo) {
            setProcessingPlan(null);
          }
          closeFlutterwaveModal();
        },
      };

      if (typeof window !== 'undefined') {
        (window as any).FlutterwaveCheckout(config);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Failed to initialize payment. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handleContinue = () => {
    if (successInfo) {
      onSuccess(successInfo.planName);
      // Reset success state so if they reopen modal it's back to normal
      setSuccessInfo(null);
      setProcessingPlan(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Continue">
      <div className="w-full max-w-4xl mx-auto px-2 py-4 relative">
        {/* Success Banner */}
        <AnimatePresence>
          {successInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl text-center">
                <PartyPopper size={40} className="mx-auto mb-4" />
                <h2 className="text-2xl font-extrabold mb-2 flex items-center justify-center gap-2">
                  <CheckCircle2 size={24} />
                  Subscription Activated!
                </h2>
                <p className="text-emerald-50 mb-6">
                  You are now on the <span className="font-bold uppercase">{successInfo.planName}</span> plan.
                </p>
                <Button 
                  onClick={handleContinue}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3 rounded-xl shadow-lg"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!successInfo && (
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
              Choose the Perfect Plan
            </h2>
            <p className="text-slate-600 font-medium">
              Join thousands of students getting better grades.
            </p>
          </div>
        )}

        {/* Processing overlay for verification */}
        <AnimatePresence>
          {processingPlan === 'verifying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 border border-slate-100">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Verifying Payment...</h3>
                <p className="text-slate-500 font-medium">Please wait while we confirm your subscription.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!successInfo && isLoading ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-50 rounded-3xl h-[400px] border-2 border-slate-100 p-6 animate-pulse">
                <div className="w-1/2 h-8 bg-slate-200 rounded mb-4"></div>
                <div className="w-3/4 h-12 bg-slate-200 rounded mb-8"></div>
                <div className="space-y-4">
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !successInfo ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className="h-full">
                <PlanCard
                  plan={plan}
                  isCurrentPlan={currentPlan === plan.name}
                  onSelect={handlePayment}
                  isProcessing={processingPlan === plan.name}
                  hasActiveSubscription={currentPlan !== 'free'}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
