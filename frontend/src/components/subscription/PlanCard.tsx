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
  const isPremium = plan.name === 'premium';
  const isBasic = plan.name === 'basic';
  const isFree = plan.name === 'free';

  const cardStyle = isPremium
    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl'
    : isBasic
    ? 'bg-blue-50 border-2 border-blue-200 text-slate-800'
    : 'bg-white border-2 border-slate-100 text-slate-800 shadow-sm';

  const buttonStyle = isPremium
    ? 'bg-white text-indigo-600 hover:bg-slate-50'
    : isBasic
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-slate-100 text-slate-400 cursor-not-allowed';

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative p-8 rounded-3xl flex flex-col h-full ${cardStyle}`}
    >
      {isPremium && (
        <div className="absolute top-0 right-8 transform -translate-y-1/2">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Crown size={14} />
            MOST POPULAR
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 capitalize">{plan.display_name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold">
            {plan.price > 0
              ? `₦${plan.price.toLocaleString()}`
              : 'Free'}
          </span>
          {plan.price > 0 && <span className="opacity-80 font-medium">/month</span>}
        </div>
      </div>

      <div className="flex-grow">
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1 ${isPremium ? 'bg-indigo-400/30' : 'bg-green-100'}`}>
                <Check size={16} className={isPremium ? 'text-white' : 'text-green-600'} />
              </div>
              <span className={`text-sm font-medium ${isPremium ? 'opacity-90' : 'text-slate-600'}`}>
                {feature}
              </span>
            </li>
          ))}
          <li className="flex items-start gap-3">
             <div className={`mt-0.5 rounded-full p-1 ${isPremium ? 'bg-indigo-400/30' : 'bg-green-100'}`}>
                <Check size={16} className={isPremium ? 'text-white' : 'text-green-600'} />
              </div>
              <span className={`text-sm font-medium ${isPremium ? 'opacity-90' : 'text-slate-600'}`}>
                {plan.quiz_limit > 1000 ? 'Unlimited quizzes' : `${plan.quiz_limit} quizzes per day`}
              </span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => !isCurrentPlan && !isFree && onSelect(plan.name)}
        disabled={isCurrentPlan || isFree || isProcessing}
        className={`w-full py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-colors ${
          isCurrentPlan
            ? isPremium
              ? 'bg-white/20 text-white cursor-default'
              : 'bg-slate-200 text-slate-500 cursor-default'
            : buttonStyle
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : isFree ? (
          'Free Plan'
        ) : (
          'Upgrade Now'
        )}
      </button>
    </motion.div>
  );
};
