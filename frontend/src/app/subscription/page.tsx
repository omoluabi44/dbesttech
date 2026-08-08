'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { getPlans, getCurrentSubscription, initializePayment, verifyPayment } from '@/lib/api/subscription';
import { getProfile } from '@/lib/api/auth';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { PlanCard } from '@/components/subscription/PlanCard';

export default function SubscriptionPage() {
  const router = useRouter();
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
    // Strategy 1: Hide the checkout iframe
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
        // Remove it from the DOM after a short delay
        setTimeout(() => {
          try { iframe.remove(); } catch (e) { /* ignore */ }
        }, 100);
      }
    });

    // Strategy 2: Remove any Flutterwave overlay/backdrop divs
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

    // Strategy 3: Reset body overflow so the page is scrollable again
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }, []);

  // Refresh the current plan from the backend
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
    // Load Flutterwave inline script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch (e) { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const isRedirect = status === 'successful' && params.get('tx_ref') && (params.get('transaction_id') || params.get('id'));

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
        
        // Skip setting current plan if we're verifying a payment redirect to prevent race conditions
        if (!isRedirect) {
          const currentSub = await getCurrentSubscription().catch(() => ({ plan: 'free', status: 'active', start_date: null, end_date: null }));
          setCurrentPlan((currentSub as any).subscription_plan || (currentSub as any).plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription plans.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Check for redirect from Flutterwave (e.g. bank transfer, USSD, or mobile redirect)
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const tx_ref = params.get('tx_ref');
    const transaction_id = params.get('transaction_id') || params.get('id');

    if (status === 'successful' && tx_ref && transaction_id) {
      setProcessingPlan('verifying');
      verifyPayment(transaction_id, tx_ref)
        .then((verifyRes) => {
          // Use the verify response directly to update plan state
          const verifiedPlan = (verifyRes as any).plan;
          const verifiedEndDate = (verifyRes as any).end_date;

          if (verifiedPlan) {
            setCurrentPlan(verifiedPlan);
            setSuccessInfo({
              planName: verifiedPlan,
              endDate: verifiedEndDate || null,
            });
          }

          toast.success('🎉 Subscription activated! Enjoy your new plan!');
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Also refresh profile in background
          return refreshSubscriptionState();
        })
        .catch((error) => {
          console.error('Payment verification failed:', error);
          toast.error('Payment verification failed. Please contact support.');
        })
        .finally(() => {
          setProcessingPlan(null);
        });
    }
  }, [refreshSubscriptionState]);

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
          // Immediately close the Flutterwave modal so the user can see our UI
          closeFlutterwaveModal();
          setProcessingPlan('verifying');

          try {
            const txId = response.transaction_id || response.id;
            const verifyRes = await verifyPayment(
              String(txId),
              response.tx_ref
            );

            // Use verify response directly to update plan — no race condition
            const verifiedPlan = (verifyRes as any).plan || planName;
            const verifiedEndDate = (verifyRes as any).end_date || null;

            setCurrentPlan(verifiedPlan);
            setSuccessInfo({
              planName: verifiedPlan,
              endDate: verifiedEndDate,
            });
            toast.success('🎉 Subscription activated! Enjoy your new plan!');

            // Refresh profile in the background
            refreshSubscriptionState();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setProcessingPlan(null);
          }
        },
        onclose: () => {
          // If user closes the modal manually (cancelled)
          if (!successInfo) {
            setProcessingPlan(null);
          }
          // Clean up any residual modal elements
          closeFlutterwaveModal();
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

        {/* Success Banner */}
        <AnimatePresence>
          {successInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="mb-10"
            >
              <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <PartyPopper size={40} />
                    </motion.div>
                  </div>

                  <div className="text-center sm:text-left flex-grow">
                    <h2 className="text-2xl font-extrabold mb-1 flex items-center justify-center sm:justify-start gap-2">
                      <CheckCircle2 size={24} />
                      Subscription Activated!
                    </h2>
                    <p className="text-emerald-100 font-medium text-lg">
                      You are now on the <span className="font-bold text-white capitalize">{successInfo.planName}</span> plan.
                      {successInfo.endDate && (
                        <span className="block text-sm mt-1 text-emerald-200">
                          Valid until {new Date(successInfo.endDate).toLocaleDateString('en-US', { 
                            month: 'long', day: 'numeric', year: 'numeric' 
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-shrink-0 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Processing overlay for verification */}
        <AnimatePresence>
          {processingPlan === 'verifying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4"
              >
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Verifying Payment...</h3>
                <p className="text-slate-500 font-medium">Please wait while we confirm your subscription.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
