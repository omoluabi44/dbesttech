'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { getPracticeResults, retryPractice, getPracticeReview } from '@/lib/api/quiz';
import { useQuizStore } from '@/lib/stores/quizStore';
import { Loader2, AlertTriangle, Target, CheckCircle2, Eye, EyeOff, BookOpen, AlertCircle, XCircle } from 'lucide-react';
import { CartoonOwl } from '@/components/cartoon/CartoonOwl';
import { FloatingSparkles } from '@/components/cartoon/FloatingElements';
import { StarRating } from '@/components/cartoon/CartoonStars';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface StageResult {
  stage: number;
  score: number;
  total: number;
}

interface PracticeResults {
  subject_name?: string;
  score: number;
  total: number;
  status: string;
  stages: StageResult[];
}

export default function PracticeResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string, 10);
  
  const [results, setResults] = useState<PracticeResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [displayScore, setDisplayScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  
  const { data: reviewData, isLoading: loadingReview } = useQuery({
    queryKey: ['practice-review', sessionId],
    queryFn: () => getPracticeReview(sessionId),
    enabled: showReview && !!sessionId,
  });
  
  const startPracticeStore = useQuizStore((state) => state.startPractice);
  const { playQuizComplete, speakEncouragement, playStarCollect, playButtonClick } = useSoundEffects();
  const hasPlayedEffects = useRef(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data: any = await getPracticeResults(sessionId);
        const session = data.session;
        const totalScore = [1, 2, 3, 4, 5].reduce((sum, s) => sum + (session[`stage_${s}_score`] || 0), 0);
        
        const formattedResults: PracticeResults = {
          subject_name: session.subject_name || 'Practice Quiz',
          score: totalScore,
          total: 50,
          status: session.status,
          stages: [1, 2, 3, 4, 5].map(s => ({
            stage: s,
            score: session[`stage_${s}_score`] || 0,
            total: 10
          }))
        };
        
        setResults(formattedResults);
      } catch (err) {
        setError('Failed to load practice results.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [sessionId]);

  useEffect(() => {
    if (results && !loading && !hasPlayedEffects.current) {
      hasPlayedEffects.current = true;
      const percent = Math.round((results.score / Math.max(results.total, 1)) * 100);
      
      playQuizComplete();
      
      if (percent >= 80) {
        speakEncouragement('quizCompleteHigh');
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, zIndex: 1000 });
      } else if (percent >= 50) {
        speakEncouragement('stageComplete');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 1000 });
      } else {
        speakEncouragement('quizCompleteLow');
      }
    }
  }, [results, loading, playQuizComplete, speakEncouragement]);

  useEffect(() => {
    if (results) {
      let start = 0;
      const end = Math.round((results.score / Math.max(results.total, 1)) * 100);
      const duration = 1500;
      const intervalTime = 30;
      const steps = duration / intervalTime;
      const increment = end / steps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayScore(end);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.floor(start));
        }
      }, intervalTime);
      
      return () => clearInterval(timer);
    }
  }, [results]);

  const handleRetry = async () => {
    try {
      playButtonClick();
      setRetrying(true);
      const res: any = await retryPractice(sessionId);
      startPracticeStore(res.session, res.questions);
      router.push(`/quiz/session/${sessionId}`);
    } catch (err) {
      toast.error('Failed to retry session');
      setRetrying(false);
    }
  };

  const handlePlayAgain = () => {
    playButtonClick();
    router.push('/quiz/setup');
  };

  const handleSeeProgress = () => {
    playButtonClick();
    router.push('/performance');
  };

  const handleHome = () => {
    playButtonClick();
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
            <p className="text-xl font-bold text-primary-600 animate-pulse">Calculating your score...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !results) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <AlertTriangle className="w-20 h-20 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-xl text-gray-600 mb-8">{error || 'Could not find your results.'}</p>
          <Button variant="cartoon" onClick={handleHome}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const percentage = Math.round((results.score / Math.max(results.total, 1)) * 100);
  const isPassed = percentage >= 50;

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return 'text-green-500';
    if (percent >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getRingColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getOverallStars = (percent: number) => {
    if (percent >= 90) return 5;
    if (percent >= 80) return 4;
    if (percent >= 70) return 3;
    if (percent >= 50) return 2;
    return 1;
  };

  const getMiniStars = (score: number) => {
    if (score < 5) return 1;
    if (score < 9) return 2;
    return 3;
  };

  const stageColors = [
    'bg-primary/10 text-primary-dark',
    'bg-primary/10 text-primary-dark',
    'bg-primary/10 text-primary-dark',
    'bg-primary/10 text-primary-dark',
    'bg-primary/10 text-primary-dark'
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background py-10 px-4 relative overflow-hidden">
        <FloatingSparkles count={15} />
        
        <div className="max-w-5xl mx-auto space-y-12 relative z-10">
          
          {/* HERO SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center flex flex-col items-center"
          >
            <CartoonOwl 
              mood={percentage >= 80 ? 'celebrating' : percentage >= 50 ? 'proud' : 'concerned'} 
              size="lg" 
              className="mb-6 drop-shadow-xl"
            />
            
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-primary">
              {percentage >= 80 ? 'Outstanding Performance!' : 
               percentage >= 50 ? 'Great Job!' : 
               'Keep Practicing!'}
            </h1>
            
            <p className="text-2xl text-gray-700 font-medium">
              {percentage >= 80 ? "You're a true master of this topic!" : 
               percentage >= 50 ? "You've learned so much. Keep it up!" : 
               "Every try makes your brain stronger. You've got this!"}
            </p>
          </motion.div>

          {/* SCORE DISPLAY */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-lg mx-auto border-4 border-white"
          >
            <div className="relative w-72 h-72 mb-6">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md">
                <circle
                  cx="144"
                  cy="144"
                  r="120"
                  className="stroke-current text-white"
                  strokeWidth="24"
                  fill="transparent"
                />
                <circle
                  cx="144"
                  cy="144"
                  r="120"
                  className={`stroke-current ${getRingColor(percentage)} transition-all duration-1500 ease-out`}
                  strokeWidth="24"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - displayScore / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-black ${getScoreColor(displayScore)} drop-shadow-sm`}>
                  {displayScore}%
                </span>
                <span className="text-gray-600 mt-2 font-bold text-lg bg-white/80 px-4 py-1 rounded-full">
                  {results.score} / {results.total} Correct
                </span>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              onAnimationComplete={() => {
                if (getOverallStars(percentage) > 0) playStarCollect();
              }}
            >
              <StarRating rating={getOverallStars(percentage)} size="lg" className="drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* REPORT CARD SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="achievement" className="max-w-4xl mx-auto overflow-hidden relative">
              {/* Decorative Header */}
              <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-6 text-white text-center border-b-4 border-amber-500 relative">
                <h2 className="text-3xl font-extrabold flex items-center justify-center gap-3 drop-shadow-md">
                  📋 Your Report Card
                </h2>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
                  <div className="text-xl font-bold text-gray-700">
                    Subject: <span className="text-primary-600">{results.subject_name}</span>
                  </div>
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <div className="text-sm font-bold text-gray-500 mb-2">Overall Progress</div>
                    <ProgressBar progress={percentage} variant="cartoon" height="lg" showLabel={false} />
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200 relative mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <CartoonOwl mood={isPassed ? 'proud' : 'pointing'} size="sm" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 text-lg mb-1">Teacher's Comment</h4>
                      <p className="text-amber-900 font-medium text-lg">
                        {percentage >= 80 ? "Excellent work across all levels! You're a superstar! ⭐" :
                         percentage >= 50 ? "Good effort! Keep practicing and you'll be a champion! 💪" :
                         "Great try! Every practice makes you stronger! You can do it! 🌟"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Cartoon Stamp */}
                  <motion.div 
                    initial={{ scale: 3, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -10 }}
                    transition={{ delay: 1, type: "spring", stiffness: 200 }}
                    className={`absolute -right-4 -top-4 md:-right-8 md:-top-8 border-4 border-dashed rounded-lg p-3 font-black text-2xl md:text-3xl transform shadow-sm bg-white/90 backdrop-blur-sm
                      ${isPassed ? 'text-green-500 border-green-500' : 'text-orange-500 border-orange-500'}`}
                  >
                    {isPassed ? 'PASSED ⭐' : 'TRY AGAIN 💪'}
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* STAGE BREAKDOWN */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl font-extrabold text-gray-800 mb-8 flex items-center gap-3 justify-center text-center drop-shadow-sm">
              <Target className="w-8 h-8 text-primary-500" /> 🎮 Level Breakdown
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((stageNum, index) => {
                const stageData = results.stages.find(s => s.stage === stageNum);
                const delay = 0.8 + (index * 0.15);
                
                if (!stageData) {
                  return (
                    <Card key={stageNum} variant="cartoon" className="p-6 bg-gray-50/50 border-dashed opacity-70 flex flex-col items-center justify-center h-48 border-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-3 ${stageColors[index % 5]}`}>
                        {stageNum}
                      </div>
                      <span className="text-gray-500 font-bold">Not played</span>
                    </Card>
                  );
                }

                const stageScore = stageData.score;
                const isPerfect = stageScore === stageData.total;

                return (
                  <motion.div
                    key={stageNum}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay, type: "spring", bounce: 0.4 }}
                    className="h-full"
                  >
                    <Card variant="cartoon" className="p-6 h-full flex flex-col items-center justify-between relative group hover:-translate-y-2 transition-transform duration-300">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mb-2 shadow-sm ${stageColors[index % 5]}`}>
                        {stageNum}
                      </div>
                      
                      <div className="flex flex-col items-center mb-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-gray-800">{stageScore}</span>
                          <span className="text-xl font-bold text-gray-400">/{stageData.total}</span>
                        </div>
                      </div>
                      
                      <StarRating rating={getMiniStars(stageScore)} maxStars={3} size="sm" className="mb-2" />
                      
                      {isPerfect ? (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: delay + 0.5, type: "spring" }}
                          className="mt-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm"
                        >
                          Perfect!
                        </motion.div>
                      ) : (
                        <div className="mt-1 h-7"></div> /* Placeholder for alignment */
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap justify-center gap-4 pt-8 pb-8"
          >
            <Button
              variant={showReview ? "secondary" : "primary"}
              size="lg"
              className={`text-lg px-8 py-6 shadow-xl ${!showReview && 'bg-primary-500 hover:bg-primary-600 text-white border-primary-600'}`}
              onClick={() => setShowReview(!showReview)}
            >
              {showReview ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
              {showReview ? 'Hide Review' : 'Review Answers'}
            </Button>
            
            <Button
              variant="gameAction"
              size="lg"
              className="text-lg px-8 py-6 shadow-xl"
              onClick={handlePlayAgain}
            >
              Play Again!
            </Button>
            
            {!isPassed && (
              <Button
                variant="cartoon"
                size="lg"
                className="text-lg px-8 py-6 shadow-xl bg-orange-400 hover:bg-orange-500 text-white border-orange-600"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  'Retry This Quiz!'
                )}
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-6 font-bold"
              onClick={handleSeeProgress}
            >
              See Progress 📊
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="text-lg px-8 py-6 font-bold bg-white/50 hover:bg-white/80"
              onClick={handleHome}
            >
              Home 🏠
            </Button>
          </motion.div>

          {/* Detailed Review Section */}
          {showReview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6 pb-20 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-primary-500" />
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
                  {reviewData.map((review: any, index: number) => (
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
                              review.question.questionType === 'theory' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700'
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
                          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider block mb-2">Correct Answer</span>
                            <div 
                              className="text-base text-primary-700 font-semibold prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: review.question.correct_answer }}
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-500">No review data available for this session.</p>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
