import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const gradeCategories = [
  {
    id: 'primary',
    title: 'Primary School',
    theme: 'bg-primary-light border-primary/20',
    titleColor: 'text-primary-dark',
    badgeTheme: 'bg-primary/10 text-primary-dark',
    description: 'A fun, colorful world of learning! Interactive quizzes in Math, English, Science, and more — designed with playful animations to keep young learners excited.',
    imagePath: '/images/grades/primary_student.jpg',
    levels: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    features: [
      'Interactive & animated quizzes',
      'Fun rewards & celebrations',
      'Common Entrance preparation'
    ]
  },
  {
    id: 'jss',
    title: 'Junior Secondary (JSS)',
    theme: 'bg-amber-100 border-amber-200',
    titleColor: 'text-amber-700',
    badgeTheme: 'bg-amber-500/10 text-amber-700',
    description: 'Level up your learning! Deeper subjects, challenging questions, and BECE past questions for JSS 3 students preparing for their exams.',
    imagePath: '/images/grades/jss_student.jpg',
    levels: ['JSS 1', 'JSS 2', 'JSS 3'],
    features: [
      'Subject-specific challenges',
      'Detailed performance tracking',
      'BECE past questions for JSS 3'
    ]
  },
  {
    id: 'ss',
    title: 'Senior Secondary (SS)',
    theme: 'bg-slate-100 border-slate-200',
    titleColor: 'text-slate-800',
    badgeTheme: 'bg-slate-500/10 text-slate-700',
    description: 'Get exam-ready! Comprehensive coverage of WAEC, NECO, JAMB & GCE past questions with AI-generated practice across all subjects.',
    imagePath: '/images/grades/ss_student.jpg',
    levels: ['SS 1', 'SS 2', 'SS 3'],
    features: [
      'WAEC, NECO & JAMB past questions',
      'Timed exam simulations',
      'AI-powered explanations'
    ]
  }
];

export const GradeLevelsSection: React.FC = () => {
  return (
    <section id="grade-levels" className="py-24 relative overflow-hidden bg-gradient-to-b from-surface to-primary-light/20">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Built for Every Student</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Grade, Your Content — Everything You Need</h3>
            <p className="text-slate-600 text-lg">
              From taking your first steps in Primary 1 to preparing for final WAEC exams in SS 3, our platform automatically adapts to give you curriculum-aligned content for your exact level.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gradeCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex flex-col h-full"
            >
              <div className={`h-full flex flex-col rounded-3xl border-2 ${category.theme} bg-white/60 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                
                {/* Header & Image Area */}
                <div className={`p-6 pb-0 ${category.theme} border-b-0`}>
                  <h4 className={`text-2xl font-bold mb-4 ${category.titleColor}`}>{category.title}</h4>
                  
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-inner mb-6 border-4 border-white/50">
                    <Image 
                      src={category.imagePath} 
                      alt={`${category.title} students`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="p-6 flex-grow flex flex-col bg-white/80">
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {category.description}
                  </p>
                  
                  {/* Class Pills */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {category.levels.map((level) => (
                        <span 
                          key={level} 
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md ${category.badgeTheme}`}
                        >
                          {level.replace('Primary ', 'P').replace('Junior Secondary ', 'JSS').replace('Senior Secondary ', 'SS')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div className="flex-grow">
                    <ul className="space-y-3 mb-8">
                      {category.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <Link href="/register" className="block">
                      <Button variant="ghost" className={`w-full group ${category.titleColor} border border-current hover:bg-slate-50`}>
                        Start Learning
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};
