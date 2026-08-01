"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/config';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uid || !token) {
      toast.error('Invalid password reset link.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/password/reset/confirm/', { 
        uid, 
        token, 
        new_password: password, 
        new_password1: password // Some versions of dj-rest-auth expect new_password1
      });
      
      toast.success('Password has been reset successfully! You can now log in.');
      router.push('/login');
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Failed to reset password. The link may have expired.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Password</h1>
        <p className="text-slate-600">Enter your new password below.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          required
        />
        
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          required
        />
        
        <Button
          type="submit"
          className="w-full shadow-md shadow-primary/20"
          isLoading={isLoading}
          disabled={!password || !confirmPassword}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
