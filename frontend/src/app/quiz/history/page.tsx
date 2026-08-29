"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { History, Search, ArrowRight, Trophy, XCircle, Clock } from 'lucide-react';
import { getQuizHistory } from '@/lib/api/quiz';
import { formatTime, formatDate } from '@/lib/utils/formatters';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

export default function QuizHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: history, isLoading } = useQuery({
    queryKey: ['quiz', 'history'],
    queryFn: getQuizHistory,
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
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Quiz Details</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Type</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Score</th>
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
              ) : history?.length ? (
                history.map((session: any) => (
                  <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">
                        {session.completed_at ? formatDate(session.completed_at) : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {session.completed_at ? new Date(session.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{session.subject_name}</div>
                      <div className="text-sm text-slate-500">
                        {session.type === 'past_question' ? `${session.exam_body_display} ${session.year}` : session.level}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className={session.type === 'past_question' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {session.type === 'past_question' ? 'Past Question' : 'Practice'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Badge variant={session.score_percentage >= 70 ? 'success' : session.score_percentage >= 50 ? 'warning' : 'danger'}>
                          {Math.round(session.score_percentage)}%
                        </Badge>
                        <span className="text-xs text-slate-500">
                          ({session.total_questions} Qs)
                        </span>
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
        Showing your most recent quiz history.
      </div>
    </DashboardLayout>
  );
}
