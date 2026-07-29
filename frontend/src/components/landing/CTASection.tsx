import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';

export const CTASection: React.FC = () => {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 sm:p-10 md:p-16 shadow-2xl text-white overflow-hidden relative">
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to boost your grades?</h2>
            <p className="text-primary-light text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of students practicing daily. Create your free account today and unlock your full potential.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-slate-50 border-none rounded-full px-8">
                  Get Started for Free
                </Button>
              </Link>
              <p className="text-sm text-primary-light mt-4 sm:hidden">No credit card required</p>
            </div>
            <p className="text-sm text-primary-light mt-6 hidden sm:block">No credit card required. Cancel anytime.</p>
          </div>
        </div>
        
      </div>
    </section>
  );
};
