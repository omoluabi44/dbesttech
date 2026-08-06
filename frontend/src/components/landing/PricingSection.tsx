import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import api from '@/lib/api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useRouter } from 'next/navigation';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price: string;
  currency: string;
  features: string[];
  is_featured: boolean;
}

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    display_name: 'Free',
    price: '0.00',
    currency: 'NGN',
    features: ['Access to the first 10 questions of Easy level only'],
    is_featured: false
  },
  {
    id: 'monthly',
    name: 'monthly',
    display_name: 'Monthly',
    price: '1000.00',
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

export const PricingSection: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/auth/subscription/plans/');
        if (res.data && Array.isArray(res.data)) {
          setPlans(res.data);
        } else {
          setPlans(FALLBACK_PLANS);
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans, using fallback.', err);
        setPlans(FALLBACK_PLANS); // Fallback if DB is offline
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="py-24 bg-surface relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Simple Pricing</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose the perfect plan for your needs</h3>
          <p className="text-slate-600 text-lg">
            All premium plans offer exactly the same comprehensive features. Simply choose how long you'd like your subscription to last.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex"
              >
                <Card 
                  hoverEffect 
                  className={`flex flex-col w-full h-full relative border-2 ${plan.is_featured ? 'border-primary shadow-xl scale-105 z-10 md:-my-4' : 'border-slate-100 shadow-md'}`}
                >
                  {plan.is_featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-6 border-b border-slate-100 flex-grow-0">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{plan.display_name}</h4>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {plan.price === '0.00' ? 'Free' : `₦${parseFloat(plan.price).toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {plan.name === 'free' ? 'Forever free access' : 'Full premium access'}
                    </p>
                  </div>
                  
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check size={18} className="text-primary shrink-0 mt-0.5" />
                          <span className="text-slate-600 text-sm leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      variant={plan.is_featured ? 'primary' : 'outline'} 
                      className="w-full"
                      onClick={() => router.push('/register')}
                    >
                      {plan.price === '0.00' ? 'Get Started' : 'Subscribe Now'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
