"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Target, Trophy, Clock, BrainCircuit, Activity, BookOpen, Star, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSchoolCategory } from '@/lib/hooks/useSchoolCategory';
import { getOverallSummary, getWeeklyProgress } from '@/lib/api/performance';
import { getSubjects } from '@/lib/api/quiz';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/utils/formatters';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isPrimary, isGraduating } = useSchoolCategory();
  
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['performance', 'summary'],
    queryFn: getOverallSummary,
  });

  const { data: weeklyProgress, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['performance', 'weekly'],
    queryFn: getWeeklyProgress,
  });

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {user?.first_name || user?.username}!
          </h1>
          <p className="text-slate-600 mt-1">
            Let's keep learning today. You're doing great!
          </p>
        </div>
        
        <Link href={isGraduating ? "/past-questions" : "/subjects"} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20">
            {isGraduating ? "Start Past Question" : "Start New Quiz"}
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Quizzes" 
          value={isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.total_quizzes.toString() || '0'} 
          icon={<BookOpen size={20} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Accuracy Rate" 
          value={isLoadingSummary ? <Skeleton className="h-8 w-16" /> : `${Math.round(summary?.overall_accuracy || 0)}%`} 
          icon={<Target size={20} />} 
          color="bg-primary" 
        />
        <StatCard 
          title="Time Practiced" 
          value={isLoadingSummary ? <Skeleton className="h-8 w-24" /> : formatTime(summary?.total_time_spent_seconds || 0)} 
          icon={<Clock size={20} />} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Avg. Score" 
          value={isLoadingSummary ? <Skeleton className="h-8 w-16" /> : `${Math.round(summary?.overall_average_score || 0)}%`} 
          icon={<Trophy size={20} />} 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Card */}
          <Card padding="lg" className="border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Activity size={120} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" />
              Weekly Progress
            </h3>
            
            {isLoadingWeekly ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : weeklyProgress?.results?.length ? (
              <div className="space-y-6 relative z-10">
                {weeklyProgress.results.slice(0, 2).map((week: any) => (
                  <div key={week.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-800">Week of {new Date(week.week_start).toLocaleDateString()}</span>
                      <span className="text-sm font-medium text-slate-500">{week.quizzes_taken} quizzes</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-600">Accuracy</span>
                      <span className="font-bold text-primary">{Math.round(week.accuracy_rate)}%</span>
                    </div>
                    <ProgressBar progress={week.accuracy_rate} color="bg-primary" height="md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 relative z-10">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Activity size={32} />
                </div>
                <h4 className="text-lg font-medium text-slate-800 mb-1">No activity yet</h4>
                <p className="text-slate-500 mb-6">Take your first quiz this week to see your progress here.</p>
                <Link href="/subjects">
                  <Button variant="ghost" size="sm">Start a Quiz</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Special action for graduating students */}
          {isGraduating && (
            <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 shrink-0 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                  <BrainCircuit size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Past Questions Mode</h3>
                  <p className="text-slate-600">You are in a graduating class. Practice with real past questions to prepare for your final exams.</p>
                </div>
                <Link href="/past-questions">
                  <Button className="shrink-0 w-full md:w-auto shadow-md">
                    Practice Exams
                  </Button>
                </Link>
              </div>
            </Card>
          )}

        </div>

        {/* Right column - sidebar content */}
        <div className="space-y-8">
          
          {/* Quick Start Subjects */}
          <Card className="border-slate-100 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Jump Back In</h3>
              
              {isLoadingSubjects ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : subjectsData?.results?.length ? (
                <div className="space-y-3">
                  {subjectsData.results.slice(0, 4).map((subject: any) => (
                    <Link 
                      key={subject.id} 
                      href={isGraduating ? `/past-questions` : `/quiz/setup?subject=${subject.id}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-primary transition-colors">
                          <BookOpen size={18} />
                        </div>
                        <span className="font-medium text-slate-800">{subject.name}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No subjects available for your level.
                </div>
              )}
              
              <Link href={isGraduating ? "/past-questions" : "/subjects"} className="block text-center text-sm font-semibold text-primary hover:text-primary-dark mt-6">
                {isGraduating ? "View past questions" : "View all subjects"}
              </Link>
            </div>
          </Card>

          {/* Need Help? */}
          <Card className="border-slate-100 shadow-sm bg-slate-50">
            <div className="p-6 flex items-start gap-4">
              <div className="text-amber-500 mt-1">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Need help with a topic?</h4>
                <p className="text-sm text-slate-600 mb-3">Our AI explanations break down difficult concepts step by step.</p>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Available in Quiz Review</p>
              </div>
            </div>
          </Card>
          
        </div>
      </div>
    </div>
  );
}

// Helper component for stats
const StatCard = ({ title, value, icon, color }: { title: string, value: React.ReactNode, icon: React.ReactNode, color: string }) => (
  <Card className="border-slate-100 shadow-sm overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4`} />
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  </Card>
);
