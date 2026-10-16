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
  XCircle, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar, 
  BrainCircuit, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Eye,
  X,
  AlertCircle,
  HelpCircle,
  Check,
  Filter,
  GraduationCap
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
  username?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  level?: string;
  level_display?: string;
  student_profile?: {
    level_display?: string;
    level?: string;
  };
}

interface LevelOption {
  code: string;
  label: string;
  count?: number;
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
  session_id: number;
  type: 'practice' | 'past_question';
  student_id: number;
  student_name: string;
  student_email: string;
  subject_id: number;
  subject_name: string;
  level: string;
  level_code: string;
  difficulty?: string;
  exam_body?: string;
  year?: number | string;
  current_stage?: number;
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  status: string;
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
  student: StudentInfo | null;
  overall: {
    total_quizzes: number;
    total_questions: number;
    total_correct: number;
    overall_accuracy: number;
    overall_average_score: number;
  };
  by_subject: SubjectPerformanceItem[];
}

interface QuestionOption {
  label: string;
  text: string;
  is_correct: boolean;
}

interface ReviewQuestion {
  id: string;
  question_number: number;
  stage?: number;
  question_text: string;
  question_type: string;
  image_url?: string;
  options: QuestionOption[];
  selected_answer?: string;
  selected_answer_text?: string;
  correct_answer?: string;
  correct_answer_text?: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  explanation?: string;
}

interface SessionReviewData {
  session: {
    id: number;
    type: 'practice' | 'past_question';
    student_id: number;
    student_name: string;
    student_email: string;
    subject_name: string;
    topic_name?: string;
    level: string;
    difficulty?: string;
    exam_body?: string;
    year?: string | number;
    score_percentage: number;
    correct_answers: number;
    total_questions: number;
    status: string;
    started_at: string;
    completed_at: string;
  };
  questions: ReviewQuestion[];
}

function StudentResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStudentId = searchParams.get('student_id') || '';
  const initialReviewSession = searchParams.get('review_session');
  const initialReviewType = searchParams.get('review_type') as ('practice' | 'past_question' | null);

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'practice' | 'past_question'>('all');
  const [availableSubjects, setAvailableSubjects] = useState<{ id: number; name: string }[]>([]);
  const [availableLevels, setAvailableLevels] = useState<LevelOption[]>([]);
  const [levelStudentCount, setLevelStudentCount] = useState<number>(0);
  const [totalPlatformStudents, setTotalPlatformStudents] = useState<number>(0);

  const [resultsData, setResultsData] = useState<{ student: StudentInfo | null; results: QuizResultItem[] } | null>(null);
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'performance'>('history');

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState<SessionReviewData | null>(null);

  // Load students for selector (supports level filtering and up to 1000 items)
  const fetchStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const params = new URLSearchParams();
      params.append('role', 'student');
      params.append('page_size', '1000');
      if (selectedLevel && selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }
      const res = await api.get(`/auth/admin-students/?${params.toString()}`);
      if (res.data && Array.isArray(res.data.results)) {
        setStudents(res.data.results);
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Failed to load students list', err);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedLevel]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Load results and performance (either for selected student or platform-wide)
  const fetchResultsAndPerf = useCallback(async () => {
    try {
      setLoadingData(true);
      const params = new URLSearchParams();
      if (selectedStudentId && selectedStudentId !== 'all') {
        params.append('student_id', selectedStudentId);
      }
      if (selectedLevel && selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }
      if (selectedSubject && selectedSubject !== 'all') {
        params.append('subject_id', selectedSubject);
      }
      if (filterType && filterType !== 'all') {
        params.append('type', filterType);
      }
      params.append('limit', '150');

      const perfParams = new URLSearchParams();
      if (selectedStudentId && selectedStudentId !== 'all') {
        perfParams.append('student_id', selectedStudentId);
      }

      const [resResults, resPerf] = await Promise.all([
        api.get(`/performance/admin/student-results/?${params.toString()}`),
        api.get(`/performance/admin/student-performance/?${perfParams.toString()}`),
      ]);

      setResultsData(resResults.data);
      setPerfData(resPerf.data);

      if (resResults.data.available_subjects) {
        setAvailableSubjects(resResults.data.available_subjects);
      }
      if (resResults.data.available_levels) {
        setAvailableLevels(resResults.data.available_levels);
      }
      if (resResults.data.students && Array.isArray(resResults.data.students)) {
        setStudents(resResults.data.students);
        setLoadingStudents(false);
      }
      if (typeof resResults.data.student_count_for_level === 'number') {
        setLevelStudentCount(resResults.data.student_count_for_level);
      }
      if (typeof resResults.data.total_platform_students === 'number') {
        setTotalPlatformStudents(resResults.data.total_platform_students);
      }
    } catch (err) {
      console.error('Failed to load student results', err);
      toast.error('Failed to load student result history.');
    } finally {
      setLoadingData(false);
    }
  }, [selectedStudentId, selectedLevel, selectedSubject, filterType]);

  useEffect(() => {
    fetchResultsAndPerf();
  }, [fetchResultsAndPerf]);

  // Open question review modal
  const handleOpenReview = async (sessionId: number | string, type: 'practice' | 'past_question') => {
    try {
      setReviewModalOpen(true);
      setReviewLoading(true);
      setReviewData(null);
      const res = await api.get(`/performance/admin/session-review/?session_id=${sessionId}&type=${type}`);
      setReviewData(res.data);
    } catch (err) {
      console.error('Failed to load session review', err);
      toast.error('Failed to load question details for this session.');
      setReviewModalOpen(false);
    } finally {
      setReviewLoading(false);
    }
  };

  // If initial URL had review params, open review modal
  useEffect(() => {
    if (initialReviewSession) {
      handleOpenReview(initialReviewSession, initialReviewType || 'practice');
    }
  }, [initialReviewSession, initialReviewType]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const url = id && id !== 'all' ? `/admin/student-results?student_id=${id}` : '/admin/student-results';
    router.replace(url);
  };

  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    // If a student was selected, check if they belong to newLevel
    if (selectedStudentId && newLevel !== 'all') {
      const curr = students.find(s => s.id.toString() === selectedStudentId);
      const sLevel = curr?.level || curr?.student_profile?.level;
      if (curr && sLevel && sLevel !== newLevel) {
        handleSelectStudent('');
      }
    }
  };

  // Only include students belonging to the selected class level
  const studentsInLevel = students.filter(s => {
    if (selectedLevel && selectedLevel !== 'all') {
      const sLevel = s.level || s.student_profile?.level;
      return sLevel === selectedLevel;
    }
    return true;
  });

  const filteredStudents = studentsInLevel.filter(s => {
    if (!searchQuery) return true;
    const fullName = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    const email = (s.email || '').toLowerCase();
    const username = (s.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || username.includes(query);
  });

  const student = resultsData?.student || perfData?.student;
  const overall = perfData?.overall;
  const rawResults = resultsData?.results || [];

  // Client-side text search over results table
  const results = rawResults.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.student_name.toLowerCase().includes(q) ||
           item.student_email.toLowerCase().includes(q) ||
           item.subject_name.toLowerCase().includes(q) ||
           item.level.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-primary-500 w-8 h-8" />
            Student Result History, Performance & Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Track every quiz attempt across the platform, view scores and accuracy, and inspect all practiced questions and student answers.
          </p>
        </div>
      </div>

      {/* Filter and Selection Card */}
      <div className="glass-card p-6 rounded-2xl shadow-md border border-[var(--surface-dark)] space-y-5">
        {/* Top: Full-Width Search Bar */}
        <div className="w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search size={14} className="text-primary-500" />
              Search Student by Name or Email
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold text-primary-500 hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear search
              </button>
            )}
          </label>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search student by name (e.g. John Doe, David), username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground p-1 rounded-full hover:bg-[var(--surface-dark)]"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick matching student pills */}
          {searchQuery && filteredStudents.length > 0 && !selectedStudentId && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-1 text-xs">
              <span className="text-gray-400 font-semibold">Matching students:</span>
              {filteredStudents.slice(0, 6).map(s => {
                const displayName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username || 'Student';
                const displayLevel = s.level_display || s.student_profile?.level_display || 'Student';
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleSelectStudent(s.id.toString());
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white font-bold transition-all flex items-center gap-1.5 border border-primary-500/20"
                    title={`Select ${displayName}`}
                  >
                    <Users size={12} />
                    <span>{displayName}</span>
                    <span className="text-[10px] opacity-75 font-normal">({displayLevel})</span>
                  </button>
                );
              })}
              {filteredStudents.length > 6 && (
                <span className="text-gray-400 text-xs">+{filteredStudents.length - 6} more in list</span>
              )}
            </div>
          )}
        </div>

        {/* Filters in requested order: 1. Class Level -> 2. Subject -> 3. Student Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Class Level Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-primary-500" />
              1. Class Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">
                🌐 All Class Levels {totalPlatformStudents ? `(${totalPlatformStudents})` : ''}
              </option>
              {availableLevels.filter(l => l.code !== 'all').map((lvl) => (
                <option key={lvl.code} value={lvl.code}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Subject Selector (Fixed since only 1 subject) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary-500" />
              2. Subject
            </label>
            <select
              value={availableSubjects.length === 1 ? availableSubjects[0].id.toString() : selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={availableSubjects.length <= 1}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {availableSubjects.length <= 1 ? (
                availableSubjects.length === 1 ? (
                  <option value={availableSubjects[0].id.toString()}>
                    {availableSubjects[0].name} (Fixed)
                  </option>
                ) : (
                  <option value="all">Mathematics (Fixed)</option>
                )
              ) : (
                <>
                  <option value="all">All Subjects</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id.toString()}>
                      {sub.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* 3. Student Filter (Only students from the selected class level) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Users size={14} className="text-primary-500" />
              3. Student Filter {selectedLevel !== 'all' ? `(${levelStudentCount || studentsInLevel.length} in class)` : `(${totalPlatformStudents || students.length})`}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              disabled={loadingStudents}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">
                {selectedLevel !== 'all'
                  ? `🌐 All Students in ${availableLevels.find(l => l.code === selectedLevel)?.label || 'this Class'}`
                  : `🌐 All Students (Global Platform Feed - ${totalPlatformStudents || students.length})`}
              </option>
              {filteredStudents.map((s) => {
                const displayName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username || s.email;
                return (
                  <option key={s.id} value={s.id.toString()}>
                    {displayName} ({s.email})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Filter Badges Strip */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--surface-dark)] pt-3 gap-3 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Active Filter:</span>
            <span>
              {selectedStudentId
                ? `Student: ${student?.name || 'Selected Student'}`
                : selectedLevel !== 'all'
                  ? `Class: ${availableLevels.find(l => l.code === selectedLevel)?.label || selectedLevel}`
                  : 'All Platform Students'}
              {' '}&bull; {results.length} total attempts listed
            </span>
          </div>
          {(selectedStudentId || selectedLevel !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                handleSelectStudent('');
                setSelectedLevel('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
            >
              <X size={12} /> Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Selected Student Banner (if specific student chosen) */}
      {selectedStudentId && student && (
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

            {/* Student Aggregate Metrics */}
            {overall && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                <div className="glass-card p-3 rounded-xl text-center border border-[var(--surface-dark)]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase block">Total Attempts</span>
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
      )}

      {/* Tabs */}
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
          Quiz Attempts History ({results.length})
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

      {/* Loading state */}
      {loadingData && (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {/* TAB 1: Quiz History & Attempts Table */}
      {!loadingData && activeTab === 'history' && (
        <div className="space-y-4">
          {/* Type filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--surface-light)] text-gray-500 hover:bg-[var(--surface-dark)]'
              }`}
            >
              All Types ({results.length})
            </button>
            <button
              onClick={() => setFilterType('practice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'practice'
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--surface-light)] text-gray-500 hover:bg-[var(--surface-dark)]'
              }`}
            >
              Practice Quizzes
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

          {results.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-[var(--surface-dark)]">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4">
                <History size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">No Quiz Attempts Found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                No quiz practice attempts match your active filters. Try clearing the filters or searching for another student.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden border border-[var(--surface-dark)] shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {!selectedStudentId && <th className="p-4">Student</th>}
                      <th className="p-4">Type</th>
                      <th className="p-4">Subject & Level</th>
                      <th className="p-4">Details</th>
                      <th className="p-4 text-center">Score %</th>
                      <th className="p-4 text-center">Correct / Total</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Date & Time</th>
                      <th className="p-4 text-right">Questions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                    {results.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-light)] transition-colors">
                        {!selectedStudentId && (
                          <td className="p-4 font-bold text-foreground">
                            <div>
                              <span>{item.student_name}</span>
                              <span className="block text-xs font-normal text-gray-500">{item.student_email}</span>
                            </div>
                          </td>
                        )}
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
                        <td className="p-4 text-center font-black">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            item.score_percentage >= 75 ? 'bg-emerald-500/15 text-emerald-500' :
                            item.score_percentage >= 50 ? 'bg-amber-500/15 text-amber-500' : 'bg-rose-500/15 text-rose-500'
                          }`}>
                            {item.score_percentage}%
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-foreground">
                          {item.correct_answers} / {item.total_questions}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                            item.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right text-xs text-gray-400">
                          {new Date(item.completed_at || item.started_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenReview(item.session_id, item.type)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 text-xs font-bold shadow-sm transition-all"
                            title="Inspect questions, student answers, and explanations"
                          >
                            <Eye size={13} />
                            <span>Review Questions</span>
                          </button>
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
      {!loadingData && activeTab === 'performance' && (
        <div className="space-y-4">
          {(!perfData?.by_subject || perfData.by_subject.length === 0) ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-[var(--surface-dark)] text-gray-500 text-sm">
              No aggregated subject performance recorded yet.
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

      {/* QUESTION REVIEW MODAL / DRAWER */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--surface-dark)] flex items-start justify-between bg-gradient-to-r from-primary-500/10 via-transparent to-transparent">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary">
                    {reviewData?.session.type === 'practice' ? 'Practice Quiz' : 'Past Question Exam'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Session #{reviewData?.session.id}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  {reviewData?.session.subject_name} &bull; {reviewData?.session.level}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Student: <strong className="text-foreground">{reviewData?.session.student_name}</strong> ({reviewData?.session.student_email})
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-[var(--surface-light)] transition-colors"
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick Session Stats Strip */}
            {reviewData?.session && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-center text-xs">
                <div>
                  <span className="text-gray-400 block font-bold">SCORE</span>
                  <span className={`text-lg font-black ${
                    reviewData.session.score_percentage >= 75 ? 'text-emerald-500' :
                    reviewData.session.score_percentage >= 50 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {reviewData.session.score_percentage}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">ACCURACY</span>
                  <span className="text-lg font-bold text-foreground">
                    {reviewData.session.correct_answers} / {reviewData.session.total_questions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">DIFFICULTY / EXAM</span>
                  <span className="text-base font-bold text-foreground capitalize">
                    {reviewData.session.difficulty || `${reviewData.session.exam_body} (${reviewData.session.year})`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">STATUS</span>
                  <span className="text-base font-bold text-emerald-500 capitalize">
                    {reviewData.session.status}
                  </span>
                </div>
              </div>
            )}

            {/* Questions Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {reviewLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                  ))}
                </div>
              ) : reviewData?.questions && reviewData.questions.length > 0 ? (
                reviewData.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={`p-6 rounded-2xl border transition-all ${
                      q.is_correct
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-rose-500/30 bg-rose-500/5'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          q.is_correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {q.is_correct ? <Check size={16} /> : <X size={16} />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Question {idx + 1} {q.stage ? `(Stage ${q.stage})` : ''}
                          </span>
                          <span className="text-xs font-semibold text-primary-500 uppercase">
                            {q.question_type === 'theory' ? 'Theory Question' : 'Multiple Choice (MCQ)'}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        q.is_correct ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                      }`}>
                        {q.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Question Text */}
                    <div 
                      className="text-base text-foreground font-semibold mb-4 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.question_text }}
                    />

                    {/* Question Image if present */}
                    {q.image_url && (
                      <div className="mb-4">
                        <img 
                          src={q.image_url} 
                          alt="Question diagram" 
                          className="max-h-60 rounded-xl border border-[var(--surface-dark)] object-contain"
                        />
                      </div>
                    )}

                    {/* Options Grid */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, oIdx) => {
                          const isStudentSelected = q.selected_answer?.trim().toUpperCase() === opt.label.trim().toUpperCase() ||
                                                    q.selected_answer_text?.trim().toLowerCase() === opt.text.trim().toLowerCase();
                          const isCorrectOption = opt.is_correct;

                          let cardClasses = 'bg-[var(--surface-light)] border-[var(--surface-dark)] text-foreground';
                          if (isCorrectOption) {
                            cardClasses = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold';
                          } else if (isStudentSelected && !q.is_correct) {
                            cardClasses = 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3.5 rounded-xl border flex items-start gap-3 text-sm transition-all ${cardClasses}`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-[var(--surface)] text-foreground font-black text-xs flex items-center justify-center shrink-0 border border-[var(--surface-dark)]">
                                {opt.label}
                              </span>
                              <div className="flex-1">
                                <span>{opt.text}</span>
                                {isStudentSelected && (
                                  <span className={`block text-[11px] font-bold mt-1 ${
                                    isCorrectOption ? 'text-emerald-500' : 'text-rose-500'
                                  }`}>
                                    {isCorrectOption ? '✓ Student Answer (Correct)' : '✗ Student Answer'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Answers Comparison Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--surface-dark)] text-xs mb-3">
                      <div>
                        <span className="text-gray-400 font-bold block mb-0.5">Student Answer:</span>
                        <span className={`font-extrabold ${q.is_correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {q.selected_answer ? `${q.selected_answer}: ${q.selected_answer_text || ''}` : 'No answer submitted'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-0.5">Correct Answer:</span>
                        <span className="font-extrabold text-emerald-500">
                          {q.correct_answer ? `${q.correct_answer}: ${q.correct_answer_text || ''}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Explanation Box */}
                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold mb-0.5">Explanation:</strong>
                          <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No individual question records found for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--surface-dark)] flex justify-end bg-[var(--surface-light)]">
              <Button onClick={() => setReviewModalOpen(false)}>
                Close Review
              </Button>
            </div>
          </div>
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
