import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelect: (planName: string) => void;
  isProcessing: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  onSelect,
  isProcessing,
}) => {
  const isFree = plan.price === 0;
  
  // A plan is expired if its end date has already passed
  const isExpired = plan.end_date ? new Date(plan.end_date).getTime() < Date.now() : false;

  const cardStyle = plan.is_featured
    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl border-0 ring-4 ring-indigo-500/30'
    : 'bg-[var(--surface)] text-black border-2 border-[var(--surface-dark)] shadow-lg hover:border-indigo-400/50';

  const buttonStyle = plan.is_featured
    ? 'bg-white text-indigo-700 hover:bg-slate-100 shadow-md'
    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md';

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative p-8 rounded-3xl flex flex-col h-full transition-all duration-300 ${cardStyle}`}
    >
      {plan.is_featured && (
        <div className="absolute top-0 right-8 transform -translate-y-1/2">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg uppercase tracking-wider">
            <Crown size={14} />
            MOST POPULAR
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 capitalize tracking-tight">{plan.display_name}</h3>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-4xl font-extrabold">
            {plan.price > 0
              ? `₦${plan.price.toLocaleString()}`
              : 'Free'}
          </span>
          {plan.price > 0 && <span className="opacity-80 font-medium text-sm">/month</span>}
        </div>
        
        {plan.start_date && plan.end_date && (
          <div className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border ${plan.is_featured ? 'bg-indigo-900/40 border-indigo-400/30 text-indigo-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            📅 Valid: {new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>

      <div className="flex-grow">
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1.5 ${plan.is_featured ? 'bg-white/20' : 'bg-indigo-100'}`}>
                <Check size={14} className={plan.is_featured ? 'text-white' : 'text-indigo-600'} />
              </div>
              <span className={`text-sm font-medium leading-snug ${plan.is_featured ? 'opacity-95' : 'text-black'}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => !isCurrentPlan && !isFree && !isExpired && onSelect(plan.name)}
        disabled={isCurrentPlan || isFree || isProcessing || isExpired}
        className={`w-full py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-200 ${
          isCurrentPlan
            ? plan.is_featured
              ? 'bg-indigo-900/50 text-indigo-100 cursor-not-allowed border border-indigo-400/30'
              : 'bg-emerald-50 text-emerald-600 cursor-not-allowed border-2 border-emerald-200'
            : isExpired
            ? 'bg-red-50 text-red-500 cursor-not-allowed border-2 border-red-200'
            : isFree
            ? 'bg-[var(--surface-dark)] text-slate-500 cursor-not-allowed'
            : buttonStyle
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          <>
            <Check size={20} />
            Current Plan
          </>
        ) : isExpired ? (
          'Plan Expired'
        ) : isFree ? (
          'Free Plan'
        ) : (
          'Upgrade Now'
        )}
      </button>
    </motion.div>
  );
};
