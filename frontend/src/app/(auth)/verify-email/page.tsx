"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/config';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('key');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyKey = async () => {
      if (!key) {
        setStatus('error');
        toast.error('Invalid verification link.');
        return;
      }

      try {
        await api.post('/auth/registration/verify-email/', { key });
        setStatus('success');
        toast.success('Email verified successfully! You can now log in.');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        toast.error('Verification failed. The link may have expired or is invalid.');
      }
    };

    verifyKey();
  }, [key]);

  return (
    <div className="w-full text-center">
      <div className="mb-8">
        {status === 'loading' && (
          <div className="flex justify-center mb-6 text-primary">
            <Loader2 size={64} className="animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="flex justify-center mb-6 text-green-500">
            <CheckCircle2 size={64} />
          </div>
        )}
        {status === 'error' && (
          <div className="flex justify-center mb-6 text-red-500">
            <XCircle size={64} />
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Email Verification</h1>
        <p className="text-slate-600 mb-8">
          {status === 'loading' && 'Verifying your email address, please wait...'}
          {status === 'success' && 'Your email has been successfully verified!'}
          {status === 'error' && 'Failed to verify your email.'}
        </p>

        {(status === 'success' || status === 'error') && (
          <Button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto shadow-md"
          >
            Go to Login
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
