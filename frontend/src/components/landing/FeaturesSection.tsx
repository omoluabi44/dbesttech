import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Brain, LineChart, Target, Trophy, Clock, GraduationCap } from 'lucide-react';

const features = [
  {
    icon: <Brain size={24} className="text-primary" />,
    title: "AI-Powered Questions",
    description: "Never run out of practice material. Our AI generates fresh, curriculum-aligned questions tailored to your exact level.",
    color: "bg-primary-light"
  },
  {
    icon: <GraduationCap size={24} className="text-secondary" />,
    title: "Past Questions",
    description: "Prepare for the real deal with actual WAEC, NECO, and Common Entrance past questions for graduating classes.",
    color: "bg-green-100"
  },
  {
    icon: <LineChart size={24} className="text-accent" />,
    title: "Performance Analytics",
    description: "Track your progress over time with detailed charts, accuracy rates, and weekly performance summaries.",
    color: "bg-amber-100"
  },
  {
    icon: <Target size={24} className="text-rose-500" />,
    title: "Strengths & Weaknesses",
    description: "Identify exactly which topics you've mastered and which ones need more practice to optimize your study time.",
    color: "bg-rose-100"
  },
  {
    icon: <Trophy size={24} className="text-purple-500" />,
    title: "Rewards & Celebrations",
    description: "Engaging animations, sounds, and badges to keep primary school pupils motivated and excited to learn.",
    color: "bg-purple-100"
  },
  {
    icon: <Clock size={24} className="text-blue-500" />,
    title: "Timed Practice",
    description: "Simulate real exam conditions with timed quizzes to improve your speed and accuracy under pressure.",
    color: "bg-blue-100"
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Why Choose QuizMaster</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to succeed</h3>
          <p className="text-slate-600 text-lg">
            We've built a comprehensive platform that adapts to your learning needs, whether you're taking your first steps in primary school or preparing for your final WAEC exams.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hoverEffect className="h-full border-slate-100 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};
