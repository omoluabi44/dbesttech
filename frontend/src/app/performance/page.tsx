"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Target, TrendingUp, TrendingDown, Activity, Award, BrainCircuit } from 'lucide-react';
import { getOverallSummary, getBySubject, getWeeklyProgress, getStrengths } from '@/lib/api/performance';
import { getSubjects } from '@/lib/api/quiz';
import { formatTime } from '@/lib/utils/formatters';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'strengths'>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['performance', 'summary'],
    queryFn: getOverallSummary,
  });

  const { data: subjectsList } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await getSubjects();
      return res.results;
    },
  });

  const { data: bySubject, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['performance', 'bySubject'],
    queryFn: getBySubject,
  });

  const { data: weeklyProgress, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['performance', 'weekly'],
    queryFn: getWeeklyProgress,
  });

  const { data: strengthsWeaknesses, isLoading: isLoadingStrengths } = useQuery({
    queryKey: ['performance', 'strengths', selectedSubject],
    queryFn: () => getStrengths(undefined, selectedSubject),
  });

  // Prepare chart data
  const weeklyData = [...(weeklyProgress?.results || [])].reverse().map((week: any) => ({
    name: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: Math.round(week.accuracy_rate),
    quizzes: week.quizzes_taken,
  }));

  const subjectData = bySubject?.results?.map((sub: any) => ({
    name: sub.subject_name,
    score: Math.round(sub.average_score),
    accuracy: Math.round(sub.accuracy_rate),
  })) || [];

  const sortedStrengths = [...(strengthsWeaknesses?.results || [])].sort((a: any, b: any) => b.mastery_percentage - a.mastery_percentage);
  const strongestTopic = sortedStrengths.length > 0 ? sortedStrengths[0].topic_name : 'None';
  const weakestTopic = sortedStrengths.length > 0 ? sortedStrengths[sortedStrengths.length - 1].topic_name : 'None';

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Performance Analytics</h1>
        <p className="text-slate-600">Track your progress, identify strengths, and target weaknesses.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-slate-100 shadow-sm">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Overall Accuracy</p>
              <div className="text-2xl font-bold text-slate-900">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : `${Math.round(summary?.overall_accuracy || 0)}%`}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-slate-100 shadow-sm">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Questions</p>
              <div className="text-2xl font-bold text-slate-900">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.total_questions || 0}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-slate-100 shadow-sm">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Strongest Topic</p>
              <div className="text-lg font-bold text-slate-900 truncate max-w-[120px]" title={strongestTopic}>
                {isLoadingStrengths ? <Skeleton className="h-8 w-24" /> : strongestTopic}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <BrainCircuit size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Weakest Topic</p>
              <div className="text-lg font-bold text-slate-900 truncate max-w-[120px]" title={weakestTopic}>
                {isLoadingStrengths ? <Skeleton className="h-8 w-24" /> : weakestTopic}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-dark)]">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subject Filter</h3>
          <p className="text-sm text-slate-500">Select a subject to view specific performance data.</p>
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2 min-w-[200px] text-foreground focus:border-primary-500 outline-none"
        >
          <option value="">All Subjects</option>
          {subjectsList?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Progress Overview' },
          { id: 'strengths', label: 'Topic Mastery & Action Plan' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <Card padding="lg" className="border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Accuracy Trend</h3>
            {isLoadingWeekly ? (
              <Skeleton className="h-[300px] w-full" />
            ) : weeklyData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value}%`, 'Accuracy']}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                Not enough data. Take a few quizzes to see your trend!
              </div>
            )}
          </Card>
        </div>
      )}
      {activeTab === 'strengths' && (
        <div className="space-y-8">
          
          {/* Action Plan Section */}
          {!isLoadingStrengths && strengthsWeaknesses?.results?.length > 0 && (
            <Card padding="lg" className="border-orange-100 shadow-sm bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-900/30">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recommended Action Plan
                  </h3>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">
                    Based on your recent performance, focus on these top 3 areas to maximize your score improvement.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {strengthsWeaknesses.results
                  .sort((a: any, b: any) => a.mastery_percentage - b.mastery_percentage)
                  .slice(0, 3)
                  .map((item: any, idx: number) => (
                    <div key={`action-${item.id}`} className="bg-white dark:bg-[var(--surface)] p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">{idx + 1}</span>
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate" title={item.topic_name}>{item.topic_name}</h4>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-500">{item.subject_name}</p>
                          <p className="text-xs font-medium text-orange-600 mt-1">Current Mastery: {Math.round(item.mastery_percentage)}%</p>
                        </div>
                        <button className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                          Practice
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <Card padding="lg" className="border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-green-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Strengths</h3>
              </div>
            
            {isLoadingStrengths ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : strengthsWeaknesses?.results?.filter((s: any) => s.status === 'strong').length ? (
              <div className="space-y-4">
                {strengthsWeaknesses.results.filter((s: any) => s.status === 'strong').map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl border border-green-100 bg-green-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.topic_name}</h4>
                        <p className="text-xs text-slate-500">{item.subject_name}</p>
                      </div>
                      <Badge variant="success" size="sm">{Math.round(item.mastery_percentage)}% Mastery</Badge>
                    </div>
                    <ProgressBar progress={item.mastery_percentage} color="bg-green-500" height="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Keep practicing topics to build up your strengths!
              </div>
            )}
          </Card>

          {/* Weaknesses */}
          <Card padding="lg" className="border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown className="text-rose-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Needs Improvement</h3>
            </div>
            
            {isLoadingStrengths ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : strengthsWeaknesses?.results?.filter((s: any) => s.status === 'weak').length ? (
              <div className="space-y-4">
                {strengthsWeaknesses.results.filter((s: any) => s.status === 'weak').map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl border border-rose-100 bg-rose-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.topic_name}</h4>
                        <p className="text-xs text-slate-500">{item.subject_name}</p>
                      </div>
                      <Badge variant="danger" size="sm">{Math.round(item.mastery_percentage)}% Mastery</Badge>
                    </div>
                    <ProgressBar progress={item.mastery_percentage} color="bg-rose-500" height="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                You don't have any major weaknesses. Great job!
              </div>
            )}
          </Card>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
