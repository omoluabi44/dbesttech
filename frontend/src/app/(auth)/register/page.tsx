"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, User, BookOpen, School, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

import { registerSchema } from '@/lib/utils/validators';
import { SCHOOL_CATEGORIES, SCHOOL_LEVELS } from '@/lib/utils/constants';
import { register as registerApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      level: '',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const res = await registerApi(data);
      
      // When email verification is mandatory, token and user are not returned.
      // Instead, a message is returned telling them to verify.
      if (res.token && res.user) {
        setAuth(res.user, res.token);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        setRegisteredEmail(data.email);
        setIsSuccess(true);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Try to extract useful error messages from DRF response
      if (error.response?.data && typeof error.response.data === 'object') {
        const data = error.response.data;
        let hasSpecificError = false;
        
        // Loop through all error keys (e.g. email, username, password, non_field_errors, detail)
        Object.keys(data).forEach(key => {
          const messages = data[key];
          if (Array.isArray(messages) && messages.length > 0) {
            // Capitalize the field name for display
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            toast.error(`${fieldName}: ${messages[0]}`);
            hasSpecificError = true;
          } else if (typeof messages === 'string') {
            toast.error(messages);
            hasSpecificError = true;
          }
        });
        
        if (!hasSpecificError) {
          toast.error('Registration failed. Please check your details.');
        }
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6 text-green-500">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Check Your Email</h1>
        <p className="text-slate-600 mb-8">
          We've sent a verification link to <strong>{registeredEmail}</strong>. Please check your inbox and verify your email address before logging in.
        </p>
        <Button
          onClick={() => router.push('/login')}
          className="w-full shadow-md"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 md:hidden flex justify-center">
        <div className="bg-white p-2 rounded-2xl inline-flex shadow-xl">
          <img src="/logo.jpg" alt="DBestQuiz Logo" className="w-12 h-12 object-contain rounded-xl" />
        </div>
      </div>
      
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h1>
        <p className="text-slate-600">Start your journey to better grades today.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            leftIcon={<User size={18} />}
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            leftIcon={<User size={18} />}
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="johndoe"
            leftIcon={<User size={18} />}
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            leftIcon={<Mail size={18} />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* School Info */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Current Class Level</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <School size={18} />
            </div>
            <select
              className={`
                flex h-11 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                pl-10 appearance-none
                ${errors.level ? 'border-danger focus:ring-danger' : 'border-gray-200'}
              `}
              {...register('level')}
            >
              <option value="" disabled>Select your class</option>
              {SCHOOL_CATEGORIES.map(category => (
                <optgroup key={category.value} label={category.label}>
                  {SCHOOL_LEVELS.filter(l => l.category === category.value).map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {errors.level && <p className="text-sm text-danger mt-1 animate-pop-in">{errors.level.message}</p>}
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            error={errors.password_confirm?.message}
            {...register('password_confirm')}
          />
        </div>

        <Button
          type="submit"
          className="w-full shadow-md shadow-primary/20 mt-6"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
          Sign in instead
        </Link>
      </div>
    </div>
  );
}
