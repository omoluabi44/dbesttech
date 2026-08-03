'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan: 'basic' | 'premium';
  feature: string;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredPlan,
  feature,
}) => {
  const { user } = useAuthStore();
  const currentPlan = user?.subscription_plan || 'free';

  // Define plan hierarchy
  const planLevel = {
    free: 0,
    basic: 1,
    premium: 2,
  };

  const hasAccess = planLevel[currentPlan as keyof typeof planLevel] >= planLevel[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-3xl p-8 max-w-md mx-auto text-center shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
      
      <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="text-indigo-500" size={36} />
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800 mb-3">Upgrade Required</h3>
      
      <p className="text-slate-600 mb-8 font-medium">
        You need the <span className="font-bold text-indigo-600 capitalize">{requiredPlan}</span> plan to {feature}.
        Upgrade your plan to unlock this and many other amazing features!
      </p>
      
      <Link 
        href="/subscription"
        className="inline-block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-md hover:shadow-lg"
      >
        View Plans
      </Link>
    </div>
  );
};
