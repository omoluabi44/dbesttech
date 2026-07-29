"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { History, Search, ArrowRight, Trophy, XCircle, Clock } from 'lucide-react';
import { getWeeklyProgress } from '@/lib/api/performance';
import { formatTime, formatDate } from '@/lib/utils/formatters';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

export default function QuizHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Reusing the weekly progress endpoint which contains some history
  // Ideally, a dedicated /quiz/history/ endpoint should be added to the backend
  const { data, isLoading } = useQuery({
    queryKey: ['performance', 'weekly'],
    queryFn: getWeeklyProgress,
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Quiz History</h1>
          <p className="text-slate-600">Review your past quiz sessions and performance.</p>
        </div>
        
        <div className="w-full md:w-64">
          <Input 
            placeholder="Search history..." 
            leftIcon={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card padding="none" className="border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Date</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Week Stats</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Questions</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeletons
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-4 px-6"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-20" /></td>
                  </tr>
                ))
              ) : data?.results?.length ? (
                // We're adapting the weekly progress data to show history
                // In a real app, this would be a list of individual QuizSessions
                data.results.map((week: any) => (
                  <tr key={week.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{formatDate(week.week_start)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{week.quizzes_taken} quizzes taken</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {week.total_questions} total
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Badge variant={week.accuracy_rate >= 70 ? 'success' : week.accuracy_rate >= 50 ? 'warning' : 'danger'}>
                          {Math.round(week.accuracy_rate)}%
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <History size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-700">No history found</p>
                    <p className="text-sm mt-1">You haven't taken any quizzes yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="mt-6 text-center text-sm text-slate-500">
        Showing grouped weekly history. Take more quizzes to populate this view.
      </div>
    </DashboardLayout>
  );
}
