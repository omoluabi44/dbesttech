'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BookOpen, Calendar, CheckCircle2, ShieldQuestion, Play } from 'lucide-react';
import { getSubjects, getPastQuestionFilters, startPastQuestion } from '@/lib/api/quiz';
import { useQuizStore } from '@/lib/stores/quizStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { GRADUATING_LEVELS, EXAM_BODY_CHOICES } from '@/lib/utils/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function PastQuestionsPage() {
  const router = useRouter();
  const level = useAuthStore(state => state.user?.student_profile?.level);
  const startPastQuiz = useQuizStore(state => state.startPastQuiz);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedExamBody, setSelectedExamBody] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const isGraduating = level ? GRADUATING_LEVELS.includes(level) : false;

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
    enabled: isGraduating,
  });
  const subjects = subjectsData?.results || [];

  const { data: filters, isLoading: loadingFilters } = useQuery({
    queryKey: ['past-question-filters', selectedSubject, level],
    queryFn: () => getPastQuestionFilters({ subject_id: selectedSubject!, level: level! }),
    enabled: !!selectedSubject && !!level,
  });

  const startMutation = useMutation({
    mutationFn: startPastQuestion,
    onSuccess: (data) => {
      startPastQuiz(data.session, data.questions);
      router.push(`/past-questions/session/${data.session.id}`);
    },
    onError: () => {
      toast.error('Failed to start past question exam');
    }
  });

  const handleStartExam = () => {
    if (!selectedSubject || !selectedExamBody || !selectedYear || !level) return;
    startMutation.mutate({
      subject_id: selectedSubject,
      exam_body: selectedExamBody,
      year: parseInt(selectedYear, 10),
      level: level,
    });
  };

  const examBodyChoices = level ? EXAM_BODY_CHOICES[level] || [] : [];
  const availableYears = filters?.years || [];

  if (!level) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isGraduating) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="p-10 text-center flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            <ShieldQuestion className="w-16 h-16 text-slate-400 mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Graduating Classes Only</h1>
            <p className="text-slate-600 max-w-md mx-auto">
              The Past Questions Portal is exclusively available for students in graduating classes (Primary 6, JSS 3, SS 3) to prepare for their final examinations.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Past Questions Examination</h1>
          <p className="text-gray-500 mt-2">
            Select a subject, examination body, and year to begin your CBT practice session.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Step 1: Subject Selection */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary-dark font-bold text-sm mr-3">1</span>
              Select Subject
            </h2>

            {loadingSubjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject) => {
                  const isSelected = selectedSubject === subject.id;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject.id);
                        setSelectedExamBody('');
                        setSelectedYear('');
                      }}
                      className={`relative p-5 rounded-xl border transition-all duration-200 group text-left
                        ${isSelected 
                          ? 'border-primary bg-primary-light/30 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-primary-light hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-lg border transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <h3 className={`font-semibold text-lg ${isSelected ? 'text-primary-dark' : 'text-gray-900'}`}>{subject.name}</h3>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Steps 2 & 3: Configuration */}
          <div className="space-y-6">
            <div className={`transition-all duration-300 ${selectedSubject ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary-dark font-bold text-sm mr-3">2</span>
                Exam Details
              </h2>
              
              <Card className="p-6 rounded-xl border border-gray-200 shadow-sm bg-white space-y-6">
                {/* Exam Body Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <ShieldQuestion className="w-4 h-4 mr-2 text-gray-500" />
                    Examination Body
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {examBodyChoices.map((body) => {
                      const isSelected = selectedExamBody === body.value;
                      return (
                        <button
                          key={body.value}
                          onClick={() => {
                            setSelectedExamBody(body.value);
                            setSelectedYear('');
                          }}
                          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between
                            ${isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {body.label}
                          {isSelected && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Year Selection */}
                <div className={`space-y-3 transition-opacity duration-200 ${selectedExamBody ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    Examination Year
                  </label>
                  
                  {loadingFilters ? (
                    <Skeleton className="h-12 w-full rounded-lg" />
                  ) : (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                    >
                      <option value="" disabled>Select Year</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>
            </div>

            {/* Start Button */}
            <div className={`transition-opacity duration-300 ${selectedSubject && selectedExamBody && selectedYear ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Button 
                onClick={handleStartExam}
                disabled={startMutation.isPending}
                className="w-full py-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <span>{startMutation.isPending ? 'Preparing Exam...' : 'Start Exam Now'}</span>
                {!startMutation.isPending && <Play className="w-5 h-5 fill-current" />}
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
