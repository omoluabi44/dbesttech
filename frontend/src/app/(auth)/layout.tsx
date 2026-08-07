"use client";
import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 relative bg-white">
        
        {/* Back link */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to home
        </Link>
        
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right side - Image/Decoration */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary-light via-primary to-primary-dark p-12 items-center justify-center relative overflow-hidden">
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-white max-w-lg text-center">
          <div className="bg-white p-2 rounded-2xl inline-flex mb-8 shadow-xl">
            <img src="/logo.jpg" alt="DBestQuiz Logo" className="w-16 h-16 object-contain rounded-xl" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Unlock Your Potential</h2>
          <p className="text-lg text-primary-light/90 leading-relaxed">
            Join DBestQuiz to access thousands of curated questions, practice WAEC and NECO past exams, and track your performance with our intelligent AI dashboard.
          </p>
        </div>
      </div>
      
    </div>
  );
}
