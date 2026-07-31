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
            Master Your Subjects, <br />
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


      </div>
    </section>
  );
};
