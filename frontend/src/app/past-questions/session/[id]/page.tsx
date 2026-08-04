'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useQuizStore } from '@/lib/stores/quizStore';
import { submitPastQuestionAnswers, completePastQuestion } from '@/lib/api/quiz';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ChevronRight, ChevronLeft, Flag, Loader2, Clock, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function PastQuestionSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string, 10);
  
  const { 
    pastSession, 
    pastQuestions, 
    pastCurrentIndex, 
    pastAnswers, 
    setPastAnswer, 
    nextQuestion, 
    prevQuestion,
    setPastCurrentIndex
  } = useQuizStore();

  const [submitting, setSubmitting] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  useEffect(() => {
    if (!pastSession || pastSession.id !== sessionId) {
      router.push('/past-questions');
      return;
    }
  }, [pastSession, sessionId, router]);

  useEffect(() => {
    if (submitting) return;
    const timer = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [submitting]);

  const submitAnswersMutation = useMutation({
    mutationFn: async () => {
      const answersData = pastQuestions.map(q => {
        const selectedOptionId = pastAnswers.get(String(q.id));
        return {
          question_id: q.id,
          selected_answer: selectedOptionId || '',
          time_spent_seconds: Math.floor(timeSpentSeconds / pastQuestions.length),
        };
      }).filter(a => a.selected_answer !== '');

      await submitPastQuestionAnswers(sessionId, answersData as any);
      return await completePastQuestion(sessionId);
    },
    onSuccess: () => {
      toast.success('Exam submitted successfully!');
      router.push(`/past-questions/results/${sessionId}`);
    },
    onError: () => {
      toast.error('Failed to submit exam answers. Please try again.');
      setSubmitting(false);
    }
  });

  const handleSubmit = () => {
    if (confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      setSubmitting(true);
      submitAnswersMutation.mutate();
    }
  };

  if (!pastSession || pastQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const question = pastQuestions[pastCurrentIndex];
  const totalInExam = pastQuestions.length;
  const answeredCount = pastQuestions.filter(q => pastAnswers.has(String(q.id))).length;
  const isLastQuestion = pastCurrentIndex === totalInExam - 1;
  const isFirstQuestion = pastCurrentIndex === 0;

  const handleOptionSelect = (optionText: string) => {
    if (question) {
      setPastAnswer(String(question.id), optionText);
    }
  };

  const handleNext = () => {
    nextQuestion();
  };

  const handlePrev = () => {
    prevQuestion();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-wide">
                {pastSession.subject_name}
              </h1>
              <p className="text-xs font-medium text-primary tracking-wider">
                {pastSession.exam_body_display} {pastSession.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono text-lg font-medium">{formatTime(timeSpentSeconds)}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                  router.push('/dashboard');
                }
              }}
              className="bg-transparent border-primary text-primary hover:bg-primary hover:text-white"
            >
              Exit Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left/Main Column - Question Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex-1 p-6 md:p-8 rounded-lg border border-gray-200 shadow-sm bg-white flex flex-col">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-700">
                Question <span className="font-bold text-gray-900">{pastCurrentIndex + 1}</span> of {totalInExam}
              </h2>
            </div>

            {question?.questionText && (
              <div 
                className="text-lg text-gray-900 mb-10 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: question.questionText }}
              />
            )}

            <div className="space-y-3 mt-auto">
              {(() => {
                if (!question) return null;
                
                // Shuffle options deterministically
                const seed = String(question.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                let correctText = question.correct_answer;
                let incorrectList: string[] = [];
                
                if (Array.isArray(question.incorrect_answers)) {
                  incorrectList = question.incorrect_answers;
                } else if (question.incorrect_answers && typeof question.incorrect_answers === 'object') {
                  const optionsDict = question.incorrect_answers;
                  if (optionsDict[question.correct_answer]) {
                    correctText = optionsDict[question.correct_answer];
                  }
                  incorrectList = Object.entries(optionsDict)
                    .filter(([key, val]) => key !== question.correct_answer && val !== correctText)
                    .map(([key, val]) => val);
                }
                
                const options = [correctText, ...incorrectList];
                
                for (let i = options.length - 1; i > 0; i--) {
                  const j = (seed + i) % (i + 1);
                  [options[i], options[j]] = [options[j], options[i]];
                }

                return options.map((optionText: string, index: number) => {
                  const isSelected = pastAnswers.get(String(question.id)) === optionText;
                  const label = String.fromCharCode(65 + index); // A, B, C, D
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(optionText)}
                      className={`w-full text-left flex items-start p-4 rounded-lg border transition-colors
                        ${isSelected 
                          ? 'border-primary bg-primary/50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md text-sm font-bold mr-4 border
                        ${isSelected ? 'bg-primary border-primary text-white' : 'bg-gray-100 border-gray-200 text-gray-600'}
                      `}>
                        {label}
                      </span>
                      <div 
                        className={`flex-1 prose max-w-none pt-1 text-base ${isSelected ? 'text-primary' : 'text-gray-700'}`}
                        dangerouslySetInnerHTML={{ __html: optionText }}
                      />
                    </button>
                  );
                });
              })()}
            </div>
          </Card>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstQuestion}
              className="w-32 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            
            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-40 bg-primary hover:bg-primary text-white rounded-lg font-medium shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Submit Exam <Check className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="w-32 rounded-lg bg-primary hover:bg-primary text-white font-medium shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Sidebar - Question Grid */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="p-4 rounded-lg border border-gray-200 shadow-sm bg-white sticky top-24">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Exam Progress</h3>
              <p className="text-xs text-gray-500">{answeredCount} of {totalInExam} answered</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / totalInExam) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mt-6">
              {pastQuestions.map((q, idx) => {
                const isAnswered = pastAnswers.has(String(q.id));
                const isCurrent = pastCurrentIndex === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setPastCurrentIndex(idx)}
                    className={`h-9 w-full flex items-center justify-center rounded-md text-xs font-medium border transition-colors
                      ${isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''}
                      ${isAnswered 
                        ? 'bg-primary border-primary text-primary' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                variant="ghost"
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-12 rounded-xl flex items-center justify-center transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
                Submit Assessment
              </Button>
            </div>
          </Card>
        </div>

      </main>
    </div>
  );
}
