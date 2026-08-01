"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      await api.post('/auth/password/reset/', { email });
      setIsSent(true);
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error('Failed to send reset link. Please check the email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6 text-green-500">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Check Your Email</h1>
        <p className="text-slate-600 mb-8">
          We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
        </p>
        <Button
          onClick={() => setIsSent(false)}
          variant="secondary"
          className="w-full"
        >
          Try another email
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Forgot Password</h1>
        <p className="text-slate-600">Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="student@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          required
        />
        
        <Button
          type="submit"
          className="w-full shadow-md shadow-primary/20"
          isLoading={isLoading}
          disabled={!email}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
          Back to login
        </Link>
      </div>
    </div>
  );
}
