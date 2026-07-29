import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "Create an Account",
    description: "Sign up and select your current class level (Primary 1 to SS 3). The platform automatically adapts its design and content to your level."
  },
  {
    number: "02",
    title: "Choose Subject & Difficulty",
    description: "Pick a subject you want to practice. Select the difficulty level, and for graduating classes, choose specific past question years."
  },
  {
    number: "03",
    title: "Practice & Get Feedback",
    description: "Take the quiz under timed conditions. Review your answers immediately after to see step-by-step explanations for any mistakes."
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How it works</h2>
          <p className="text-slate-600 text-lg">Start practicing in less than two minutes.</p>
        </div>
        
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-6 right-6 h-0.5 bg-slate-200 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-slate-50 relative z-10 mb-8">
                  <span className="text-3xl font-black text-primary">{step.number}</span>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};
