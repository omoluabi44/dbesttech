'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Award, RefreshCcw, Home, Target, CheckCircle2, Trophy, AlertCircle, Eye, EyeOff, BookOpen, XCircle } from 'lucide-react';
import { useQuizStore } from '@/lib/stores/quizStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getPastQuestionReview } from '@/lib/api/quiz';

export default function PastQuestionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string, 10);
  const { pastSession, resetQuiz } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: reviewData, isLoading: loadingReview } = useQuery({
    queryKey: ['past-question-review', sessionId],
    queryFn: () => getPastQuestionReview(sessionId),
    enabled: showReview && !!sessionId,
  });

  if (!mounted) return null;

  if (!pastSession) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const score = pastSession.score_percentage;
  const isPass = score >= 50;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
        
        {/* Header */}
        <div className="text-center space-y-3 mt-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-full mb-2">
            <Trophy className={`w-10 h-10 ${isPass ? 'text-primary' : 'text-gray-400'}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Completed</h1>
          <p className="text-gray-600 font-medium text-lg">
            {pastSession.exam_body_display} {pastSession.year} - {pastSession.subject_name}
          </p>
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-8 sm:p-10 border border-gray-200 shadow-sm bg-white rounded-xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isPass ? 'bg-primary' : 'bg-gray-400'}`} />
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Final Score</h2>
                <div className="relative">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      className="text-gray-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="88"
                      cx="96"
                      cy="96"
                    />
                    <motion.circle
                      className={isPass ? 'text-primary' : 'text-gray-400'}
                      strokeWidth="10"
                      strokeDasharray={88 * 2 * Math.PI}
                      strokeDashoffset={(88 * 2 * Math.PI) * (1 - score / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="88"
                      cx="96"
                      cy="96"
                      initial={{ strokeDashoffset: 88 * 2 * Math.PI }}
                      animate={{ strokeDashoffset: (88 * 2 * Math.PI) * (1 - score / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-900 tracking-tight">
                      {Math.round(score)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl flex flex-col items-center justify-center text-center">
                  <Target className="w-6 h-6 text-primary mb-3" />
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total</span>
                  <span className="text-3xl font-bold text-gray-900">{pastSession.total_questions}</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mb-3" />
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Correct</span>
                  <span className="text-3xl font-bold text-gray-900">{pastSession.correct_answers}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => setShowReview(!showReview)}
            variant={showReview ? "secondary" : "primary"}
            className={`w-full sm:w-auto px-8 py-5 rounded-lg font-medium text-base flex items-center justify-center space-x-2 transition-colors ${!showReview && 'bg-primary hover:bg-primary text-white shadow-sm'}`}
          >
            {showReview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>{showReview ? 'Hide Review' : 'Review Answers'}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              resetQuiz();
              router.push('/past-questions');
            }}
            className="w-full sm:w-auto px-8 py-5 rounded-lg font-medium text-base flex items-center justify-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Try Another Exam</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => {
              resetQuiz();
              router.push('/dashboard');
            }}
            className="w-full sm:w-auto px-6 py-5 rounded-lg font-medium text-base flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Detailed Review Section */}
        {showReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-6 pb-20"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-primary" />
                Detailed Question Review
              </h3>
            </div>

            {loadingReview ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : reviewData && reviewData.length > 0 ? (
              <div className="space-y-6">
                {reviewData.map((review: any, index: number) => {
                  const correctAnsLetter = review.question.correct_answer;
                  const correctText = review.question.incorrect_answers && typeof review.question.incorrect_answers === 'object' && !Array.isArray(review.question.incorrect_answers)
                    ? review.question.incorrect_answers[correctAnsLetter] || correctAnsLetter
                    : correctAnsLetter;
                    
                  return (
                  <Card key={review.id} className="p-6 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-start mb-6">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 border ${
                        review.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        {review.is_correct ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Question {index + 1}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            review.question.questionType === 'theory' ? 'bg-purple-100 text-purple-700' : 'bg-primary text-primary'
                          }`}>
                            {review.question.questionType === 'theory' ? 'Theory' : 'Objective'}
                          </span>
                        </div>
                        <div 
                          className="text-lg text-gray-900 font-medium prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: review.question.questionText }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Your Answer</span>
                        <div 
                          className={`text-base ${review.is_correct ? 'text-green-700 font-semibold' : 'text-red-600'} prose max-w-none`}
                          dangerouslySetInnerHTML={{ __html: review.selected_answer || '<i>No answer provided</i>' }}
                        />
                      </div>
                      
                      {!review.is_correct && (
                        <div className="bg-primary/50 rounded-lg p-4 border border-primary">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Correct Answer</span>
                          <div 
                            className="text-base text-primary font-semibold prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: correctText }}
                          />
                        </div>
                      )}
                    </div>

                    {review.question.explanation && (
                      <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100 flex items-start">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">Explanation</span>
                          <div 
                            className="text-sm text-amber-900 prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: review.question.explanation }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                )})}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-500">No review data available for this session.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
