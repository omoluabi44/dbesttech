'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { getPlans, getCurrentSubscription, initializePayment, verifyPayment } from '@/lib/api/subscription';
import { getProfile } from '@/lib/api/auth';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { PlanCard } from '@/components/subscription/PlanCard';
import { closePaymentModal } from 'flutterwave-react-v3';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    // Load Flutterwave inline script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, currentSub] = await Promise.all([
          getPlans(),
          getCurrentSubscription().catch(() => ({ plan: 'free', status: 'active' as const, start_date: null, end_date: null })),
        ]);
        setPlans(plansData);
        setCurrentPlan((currentSub as any).subscription_plan || (currentSub as any).plan || 'free');
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription plans.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        callback: async (response: { transaction_id: number; tx_ref: string }) => {
          try {
            await verifyPayment(
              String(response.transaction_id),
              response.tx_ref
            );
            toast.success('🎉 Subscription activated! Enjoy your new plan!');
            // Refresh data
            const subRes = await getCurrentSubscription();
            setCurrentPlan((subRes as any).subscription_plan || (subRes as any).plan || 'free');
            // Update user in store
            try {
              const profileRes = await getProfile();
              updateUser(profileRes);
            } catch (e) {
              console.error('Error refreshing profile:', e);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
          closePaymentModal();
        },
        onClose: () => {
          setProcessingPlan(null);
        },
      };

      // Use FlutterwaveCheckout from window
      if (typeof window !== 'undefined') {
        (window as any).FlutterwaveCheckout(config);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Failed to initialize payment. Please try again.');
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm mb-6">
            <Sparkles size={16} />
            Unlock Your Full Potential
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
            Choose the Perfect Plan <br className="hidden md:block" /> for Your Learning Journey
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Join thousands of students getting better grades. Upgrade to unlock more quizzes, detailed analytics, and premium features!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-[500px] border-2 border-slate-100 p-8 flex flex-col animate-pulse">
                <div className="w-1/2 h-8 bg-slate-200 rounded mb-4"></div>
                <div className="w-3/4 h-12 bg-slate-200 rounded mb-12"></div>
                <div className="space-y-4 mb-auto">
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                  <div className="w-full h-4 bg-slate-200 rounded"></div>
                </div>
                <div className="w-full h-14 bg-slate-200 rounded-2xl mt-8"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={plan.name === 'premium' ? 'md:-mt-8 md:mb-8' : ''}
              >
                <PlanCard
                  plan={plan}
                  isCurrentPlan={currentPlan === plan.name}
                  onSelect={handlePayment}
                  isProcessing={processingPlan === plan.name}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
