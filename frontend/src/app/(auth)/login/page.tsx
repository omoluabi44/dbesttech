"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, BookOpen } from 'lucide-react';
import { z } from 'zod';

import { loginSchema } from '@/lib/utils/validators';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setShowResend(false);
      const res = await login(data);
      setAuth(res.user, res.token);
      toast.success(res.message || 'Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.non_field_errors?.[0] || 
                       error.response?.data?.message || 
                       'Invalid email or password. Please try again.';
      toast.error(errorMsg);
      
      if (errorMsg.includes('verify your email')) {
        setShowResend(true);
        setUnverifiedEmail(data.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      const api = (await import('@/lib/api/client')).default;
      await api.post('/auth/resend-verification/', { email: unverifiedEmail });
      toast.success('Verification email resent! Check your inbox.');
      setShowResend(false);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to resend. Try again later.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 md:hidden flex justify-center">
        <div className="bg-white p-2 rounded-2xl inline-flex shadow-xl">
          <img src="/logo.jpg" alt="DBestQuiz Logo" className="w-12 h-12 object-contain rounded-xl" />
        </div>
      </div>
      
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
        <p className="text-slate-600">Enter your details to access your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="student@example.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />
        
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link href="#" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full shadow-md shadow-primary/20"
          isLoading={isLoading}
        >
          Sign In
        </Button>
        
        {showResend && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center animate-fade-in">
            <p className="text-sm text-slate-600 mb-3">Didn't receive the email?</p>
            <Button
              type="button"
              variant="ghost"
              className="w-full border border-primary text-primary hover:bg-primary/5"
              onClick={handleResend}
              isLoading={isResending}
            >
              Resend Verification Email
            </Button>
          </div>
        )}
      </form>

      <div className="mt-8 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
          Sign up for free
        </Link>
      </div>
    </div>
  );
}
