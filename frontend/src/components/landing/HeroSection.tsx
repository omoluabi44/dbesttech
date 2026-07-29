import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-light/50 via-surface to-secondary/10" />
      <div className="absolute top-20 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-[-10%] -z-10 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary-dark font-medium text-sm mb-6 border border-primary/20"
          >
            <Sparkles size={16} />
            <span>AI-Powered Learning Platform</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
          >
            Master Your Subjects, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Ace Your Exams
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            The smartest way for primary and secondary school students to practice WAEC, NECO, and everyday subjects with AI-generated questions and real-time performance tracking.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto group rounded-full shadow-lg shadow-primary/25">
                Start Practicing Free
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full px-8 border-2 border-primary-100 text-primary-700 hover:bg-primary-50">
                I already have an account
              </Button>
            </Link>
          </motion.div>

        </div>
        
        {/* Abstract mock UI floating below */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 mx-auto max-w-4xl relative"
        >
          <div className="rounded-2xl border border-slate-200/60 shadow-2xl bg-white/80 backdrop-blur overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-4">
              <div className="h-4 w-24 bg-slate-200 rounded-full mb-2"></div>
              <div className="h-12 bg-white rounded-xl border border-slate-100 shadow-sm"></div>
              <div className="h-12 bg-white rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-primary"></div>
              <div className="h-12 bg-white rounded-xl border border-slate-100 shadow-sm"></div>
            </div>
            <div className="w-full md:w-2/3 p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-32 bg-slate-200 rounded-full"></div>
                <div className="h-8 w-20 bg-green-100 rounded-full"></div>
              </div>
              <div className="h-20 bg-slate-100 rounded-xl mb-6"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 border-2 border-slate-100 rounded-xl"></div>
                <div className="h-12 border-2 border-primary bg-primary/5 rounded-xl"></div>
                <div className="h-12 border-2 border-slate-100 rounded-xl"></div>
                <div className="h-12 border-2 border-slate-100 rounded-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Floating badge (Commented out per request) 
          <div className="absolute -right-6 -top-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slight hidden md:flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full text-amber-500">
              <BrainCircuit size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">AI Generation</p>
              <p className="text-sm font-bold text-slate-800">Unlimited Quizzes</p>
            </div>
          </div>
          */}
        </motion.div>
      </div>
    </section>
  );
};
