'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  History, 
  BarChart3, 
  Target, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar, 
  BrainCircuit, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/utils/formatters';

interface StudentOption {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  student_profile?: {
    level_display?: string;
    level?: string;
  };
}

interface StudentInfo {
  id: number;
  email: string;
  name: string;
  level: string;
  level_code: string;
}

interface QuizResultItem {
  id: string;
  type: 'practice' | 'past_question';
  subject_name: string;
  level: string;
  difficulty?: string;
  exam_body?: string;
  year?: number | string;
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  started_at: string;
  completed_at: string;
}

interface SubjectPerformanceItem {
  subject_name: string;
  level: string;
  total_quizzes_taken: number;
  total_questions_attempted: number;
  total_correct_answers: number;
  average_score: number;
  best_score: number;
  accuracy_rate: number;
}

interface PerformanceData {
  student: StudentInfo;
  overall: {
    total_quizzes: number;
    total_questions: number;
    total_correct: number;
    overall_accuracy: number;
    overall_average_score: number;
  };
  by_subject: SubjectPerformanceItem[];
}

function StudentResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStudentId = searchParams.get('student_id');

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [resultsData, setResultsData] = useState<{ student: StudentInfo; results: QuizResultItem[] } | null>(null);
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'performance'>('history');
  const [filterType, setFilterType] = useState<'all' | 'practice' | 'past_question'>('all');

  // Load students for selector
  const fetchStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const res = await api.get('/auth/admin-students/?role=student&page_size=100');
      if (res.data && Array.isArray(res.data.results)) {
        setStudents(res.data.results);
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Failed to load students list', err);
      toast.error('Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Load student results & performance when student is selected
  const fetchStudentData = useCallback(async (id: string) => {
    if (!id) {
      setResultsData(null);
      setPerfData(null);
      return;
    }

    try {
      setLoadingData(true);
      const [resResults, resPerf] = await Promise.all([
        api.get(`/performance/admin/student-results/?student_id=${id}`),
        api.get(`/performance/admin/student-performance/?student_id=${id}`),
      ]);
      setResultsData(resResults.data);
      setPerfData(resPerf.data);
    } catch (err) {
      console.error('Failed to load student results', err);
      toast.error('Failed to load student result history.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentData(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentData]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    router.replace(`/admin/student-results?student_id=${id}`);
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const email = (s.email || '').toLowerCase();
    const username = (s.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || username.includes(query);
  });

  const student = resultsData?.student || perfData?.student;
  const overall = perfData?.overall;
  const results = resultsData?.results || [];

  const filteredResults = results.filter(r => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-primary-500 w-8 h-8" />
            Student Result History & Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Review detailed quiz submissions, scores, and subject mastery for individual students.
          </p>
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="glass-card p-6 rounded-2xl shadow-md border border-[var(--surface-dark)]">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Select Student
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={selectedStudentId}
            onChange={(e) => handleSelectStudent(e.target.value)}
            disabled={loadingStudents}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="">-- Choose a student to view details ({filteredStudents.length} available) --</option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.first_name} {s.last_name} ({s.email}) - {s.student_profile?.level_display || 'Student'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* When no student is selected */}
      {!selectedStudentId && (
        <div className="glass-card p-12 text-center rounded-2xl border border-[var(--surface-dark)]">
          <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No Student Selected</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Please search and select a student from the dropdown above to inspect their performance history, completed quizzes, and subject accuracy.
          </p>
        </div>
      )}

      {/* Loading state */}
      {selectedStudentId && loadingData && (
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {/* Student Data Content */}
      {selectedStudentId && !loadingData && student && (
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="glass-card p-6 rounded-2xl border border-[var(--surface-dark)] shadow-md bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{student.name}</h2>
                    <Badge variant="primary">{student.level || 'Student'}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{student.email}</p>
                </div>
              </div>

              {/* High-level Metrics */}
              {overall && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                  <div className="glass-card p-3 rounded-xl text-center border border-[var(--surface-dark)]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Quizzes</span>
                    <span className="text-lg font-extrabold text-foreground">{overall.total_quizzes}</span>
                  </div>
                  <div className="glass-card p-3 rounded-xl text-center border border-[var(--surface-dark)]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Questions</span>
                    <span className="text-lg font-extrabold text-foreground">{overall.total_questions}</span>
                  </div>
                  <div className="glass-card p-3 rounded-xl text-center border border-[var(--surface-dark)]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Accuracy</span>
                    <span className="text-lg font-extrabold text-emerald-500">{overall.overall_accuracy}%</span>
                  </div>
                  <div className="glass-card p-3 rounded-xl text-center border border-[var(--surface-dark)]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Avg Score</span>
                    <span className="text-lg font-extrabold text-primary-500">{overall.overall_average_score}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--surface-dark)] gap-6">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500 hover:text-foreground'
              }`}
            >
              <History size={16} />
              Quiz Result History ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'performance'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500 hover:text-foreground'
              }`}
            >
              <BarChart3 size={16} />
              Performance by Subject ({perfData?.by_subject?.length || 0})
            </button>
          </div>

          {/* TAB 1: Quiz History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Type filter pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-[var(--surface-light)] text-gray-500 hover:bg-[var(--surface-dark)]'
                  }`}
                >
                  All ({results.length})
                </button>
                <button
                  onClick={() => setFilterType('practice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === 'practice'
                      ? 'bg-primary-500 text-white'
                      : 'bg-[var(--surface-light)] text-gray-500 hover:bg-[var(--surface-dark)]'
                  }`}
                >
                  Practice Sessions
                </button>
                <button
                  onClick={() => setFilterType('past_question')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === 'past_question'
                      ? 'bg-primary-500 text-white'
                      : 'bg-[var(--surface-light)] text-gray-500 hover:bg-[var(--surface-dark)]'
                  }`}
                >
                  Past Questions
                </button>
              </div>

              {filteredResults.length === 0 ? (
                <div className="glass-card p-8 text-center rounded-2xl border border-[var(--surface-dark)] text-gray-500 text-sm">
                  No completed quiz results found for this student.
                </div>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-[var(--surface-dark)] shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-4">Type</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Details</th>
                          <th className="p-4 text-center">Score %</th>
                          <th className="p-4 text-center">Correct / Total</th>
                          <th className="p-4 text-right">Date Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                        {filteredResults.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--surface-light)] transition-colors">
                            <td className="p-4">
                              {item.type === 'practice' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  <BookOpen size={12} /> Practice
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                  <BrainCircuit size={12} /> Past Question
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-bold text-foreground">
                              {item.subject_name}
                              <span className="block text-xs font-normal text-gray-500">{item.level}</span>
                            </td>
                            <td className="p-4 text-xs text-gray-500">
                              {item.type === 'practice' ? (
                                <span className="capitalize">Difficulty: {item.difficulty || 'Medium'}</span>
                              ) : (
                                <span>{item.exam_body} ({item.year})</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-black text-base ${
                                item.score_percentage >= 75 ? 'text-emerald-500' :
                                item.score_percentage >= 50 ? 'text-amber-500' : 'text-rose-500'
                              }`}>
                                {item.score_percentage}%
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-foreground">
                              {item.correct_answers} / {item.total_questions}
                            </td>
                            <td className="p-4 text-right text-xs text-gray-400">
                              {new Date(item.completed_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Performance by Subject */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {(!perfData?.by_subject || perfData.by_subject.length === 0) ? (
                <div className="glass-card p-8 text-center rounded-2xl border border-[var(--surface-dark)] text-gray-500 text-sm">
                  No aggregated subject performance recorded yet for this student.
                </div>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-[var(--surface-dark)] shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-4">Subject</th>
                          <th className="p-4 text-center">Quizzes Taken</th>
                          <th className="p-4 text-center">Questions Attempted</th>
                          <th className="p-4 text-center">Correct Answers</th>
                          <th className="p-4 text-center">Accuracy %</th>
                          <th className="p-4 text-center">Avg Score %</th>
                          <th className="p-4 text-center">Best Score %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                        {perfData.by_subject.map((sub, idx) => (
                          <tr key={idx} className="hover:bg-[var(--surface-light)] transition-colors">
                            <td className="p-4 font-bold text-foreground">
                              {sub.subject_name}
                              <span className="block text-xs font-normal text-gray-500 capitalize">{sub.level.replace('_', ' ')}</span>
                            </td>
                            <td className="p-4 text-center font-bold text-foreground">
                              {sub.total_quizzes_taken}
                            </td>
                            <td className="p-4 text-center text-gray-500">
                              {sub.total_questions_attempted}
                            </td>
                            <td className="p-4 text-center font-bold text-primary-500">
                              {sub.total_correct_answers}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-bold ${
                                sub.accuracy_rate >= 80 ? 'text-emerald-500' :
                                sub.accuracy_rate >= 50 ? 'text-amber-500' : 'text-gray-400'
                              }`}>
                                {sub.accuracy_rate}%
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-foreground">
                              {sub.average_score}%
                            </td>
                            <td className="p-4 text-center font-extrabold text-emerald-500">
                              {sub.best_score}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminStudentResultsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-[var(--surface-light)] rounded-xl" />
        <div className="h-32 bg-[var(--surface-light)] rounded-2xl" />
        <div className="h-64 bg-[var(--surface-light)] rounded-2xl" />
      </div>
    }>
      <StudentResultsContent />
    </Suspense>
  );
}
