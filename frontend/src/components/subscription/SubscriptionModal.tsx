'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planName: string) => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSubscribeClick = () => {
    // Redirect to the subscription page and pass the current path as a return URL
    router.push(`/subscription?returnUrl=${encodeURIComponent(pathname)}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Continue">
      <div className="text-center p-4 sm:p-6 relative overflow-hidden">
        {/* Decorative gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
        
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-5 shadow-lg">
          <Crown className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full Access!</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          You've reached the limit for the Free plan. Subscribe now to unlock all remaining questions and continue your learning adventure exactly where you left off.
        </p>
        
        <div className="space-y-4">
          <Button 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg shadow-md transition-all"
            onClick={handleSubscribeClick}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Subscribe Now
          </Button>
          
          <Button 
            variant="ghost"
            onClick={onClose}
            className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel and Go Back
          </Button>
        </div>
      </div>
    </Modal>
  );
}
