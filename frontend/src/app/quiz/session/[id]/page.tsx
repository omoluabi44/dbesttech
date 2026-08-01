'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/lib/stores/quizStore';
import { submitPracticeStage } from '@/lib/api/quiz';
import { PracticeStageSubmitResponse, QuizQuestion } from '@/lib/types/quiz';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, ChevronRight, ChevronLeft, Flag, Loader2, Star, Clock, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

import { CartoonFox } from '@/components/cartoon/CartoonFox';
import { FloatingClouds, FloatingSparkles } from '@/components/cartoon/FloatingElements';
import { StarBurst, StarCounter, StarRating } from '@/components/cartoon/CartoonStars';
import { SpeechBubble } from '@/components/cartoon/SpeechBubble';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string, 10);
  
  const { 
    practiceSession, 
    practiceQuestions, 
    currentIndex, 
    answers, 
    nextQuestion, 
    prevQuestion, 
    setAnswer,
    setPracticeStageQuestions
  } = useQuizStore();

  const [currentStage, setCurrentStage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [stageResult, setStageResult] = useState<PracticeStageSubmitResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [totalScore, setTotalScore] = useState(0);

  const { 
    playPop, playCorrect, playWrong, playStageComplete, playQuizComplete, 
    playCountdown, playButtonClick, playStarCollect, playWhoosh, playSuccess, 
    speakEncouragement, startBackgroundMusic, stopBackgroundMusic, toggleMute, isMuted 
  } = useSoundEffects();

  useEffect(() => {
    startBackgroundMusic();
    speakEncouragement('quizStart');
    return () => {
      stopBackgroundMusic();
    };
  }, [startBackgroundMusic, stopBackgroundMusic, speakEncouragement]);

  // Redirect if no session
  useEffect(() => {
    if (!practiceSession) {
      router.push('/quiz/setup');
    }
  }, [practiceSession, router]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(120);
  }, [currentIndex]);

  if (!practiceSession || practiceQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <Loader2 className="w-16 h-16 animate-spin text-sky-500" />
      </div>
    );
  }

  const question = practiceQuestions[currentIndex];
  const totalInStage = practiceQuestions.length;
  const answeredCount = practiceQuestions.filter(q => answers.has(q.id)).length;
  const isLastQuestion = currentIndex === totalInStage - 1;
  const canSubmit = practiceQuestions.every(q => answers.has(q.id));

  const handleOptionSelect = (optionText: string) => {
    playPop();
    if (question) {
      setAnswer(String(question.id), optionText);
    }
  };

  const handleNext = () => {
    playWhoosh();
    nextQuestion();
  };

  const handlePrev = () => {
    playWhoosh();
    prevQuestion();
  };

  const handleSubmitStage = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !canSubmit) {
      toast.error('Please answer all questions before submitting the stage');
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      // Format answers for API
      const formattedAnswers = Array.from(answers.entries()).map(([qId, oId]) => ({
        question_id: String(qId),
        selected_answer: String(oId)
      }));

      const result = await submitPracticeStage(sessionId, { stage: currentStage, answers: formattedAnswers });
      setStageResult(result);
      setTotalScore(prev => prev + result.stage_score);
      setShowInterstitial(true);
      
      playStageComplete();
      speakEncouragement('stageComplete');
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FFB800', '#FF3D00', '#00E5FF', '#D500F9', '#00E676']
      });
      
    } catch (err) {
      toast.error('Failed to submit stage. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    playButtonClick();
    if (currentStage >= 5 || !stageResult?.next_questions) {
      router.push(`/quiz/results/${sessionId}`);
    } else {
      setCurrentStage(prev => prev + 1);
      setPracticeStageQuestions(stageResult.next_questions);
      setShowInterstitial(false);
      setStageResult(null);
      setTimeLeft(120);
    }
  };

  useEffect(() => {
    if (showInterstitial || !practiceSession || submitting) return;

    if (timeLeft <= 0) {
      if (isLastQuestion) {
        handleSubmitStage(true);
      } else {
        handleNext();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        if (nextTime === 15) {
          speakEncouragement('timerWarning');
        }
        if (nextTime <= 10 && nextTime > 0) {
          playCountdown();
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showInterstitial, practiceSession, submitting, speakEncouragement, playCountdown, isLastQuestion, currentIndex]);

  return (
    <div className={`min-h-screen bg-background flex flex-col font-sans transition-colors duration-500 overflow-hidden relative`}>
      <FloatingClouds count={4} className="opacity-60" />
      
      {/* Header / HUD */}
      <header className="bg-white border-b-8 border-sky-200 sticky top-0 z-20 shadow-sm rounded-b-3xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CartoonFox mood="thinking" size="sm" />
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-sky-900">
                {practiceSession.subject_name || 'Practice Quiz'}
              </h1>
              <p className="text-sm font-black text-sky-500 uppercase tracking-widest">Stage {currentStage} of 5</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs mx-4 hidden md:block">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 h-3 bg-sky-100 -z-10 transform -translate-y-1/2 rounded-full" />
              {[1, 2, 3, 4, 5].map((stage) => (
                <motion.div 
                  key={stage}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: stage === currentStage ? 1.3 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base border-4 shadow-sm transition-all duration-300
                    ${stage < currentStage ? 'bg-green-400 border-green-500 text-white z-10' : 
                      stage === currentStage ? 'bg-yellow-400 border-yellow-500 text-yellow-900 z-10' : 
                      'bg-white border-gray-200 text-gray-400'}`}
                >
                  {stage < currentStage ? <CheckCircle2 className="w-6 h-6" /> : stage}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <StarCounter count={totalScore} />
            
            <div className="hidden sm:block text-center bg-sky-100 px-4 py-1.5 rounded-2xl border-4 border-sky-200">
              <span className="text-xs font-black text-sky-600 uppercase block leading-none">Answered</span>
              <span className="font-extrabold text-lg text-sky-900 leading-none">{answeredCount} <span className="text-sky-400">/ {totalInStage}</span></span>
            </div>

            <motion.div
              animate={{ 
                rotate: timeLeft <= 10 ? [-5, 5, -5, 5, 0] : timeLeft <= 30 ? [-2, 2, -2, 2, 0] : 0,
                scale: timeLeft <= 10 ? [1, 1.1, 1] : 1
              }}
              transition={{ repeat: timeLeft <= 30 ? Infinity : 0, duration: 0.5 }}
              className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 rounded-xl md:rounded-2xl border-2 md:border-4 font-black text-sm md:text-lg
                ${timeLeft <= 10 ? 'bg-red-500 border-red-600 text-white' : 
                  timeLeft <= 30 ? 'bg-yellow-400 border-yellow-500 text-yellow-900' : 
                  'bg-sky-400 border-sky-500 text-white'}`}
            >
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </motion.div>

            <button 
              onClick={toggleMute}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="border-2 border-red-200 bg-white text-red-500 hover:bg-red-50 rounded-xl font-bold"
            >
              Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -100, rotate: -2 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full"
          >
            <Card variant="cartoon" className="p-6 md:p-8 rounded-[2rem] relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-100 rounded-full -ml-24 -mb-24 opacity-50 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="bg-sky-400 text-white px-5 py-2 rounded-full border-4 border-sky-500 font-extrabold text-sm uppercase tracking-wider shadow-sm">
                  Question {currentIndex + 1} <span className="opacity-75">of {totalInStage}</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-700 bg-yellow-300 border-4 border-yellow-400 px-5 py-2 rounded-full font-black text-sm uppercase shadow-sm">
                  <Star className="w-5 h-5 fill-yellow-600 text-yellow-600" /> 1 Point
                </div>
              </div>

              {question?.questionText && (
                <div 
                  className="text-2xl md:text-3xl text-slate-800 font-black mb-10 leading-tight relative z-10"
                  dangerouslySetInnerHTML={{ __html: question.questionText }}
                />
              )}

              <div className="space-y-4 relative z-10">
                {(() => {
                  if (!question) return null;
                  
                  const seed = String(question.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                  const options = [question.correct_answer, ...(question.incorrect_answers || [])];
                  
                  for (let i = options.length - 1; i > 0; i--) {
                    const j = (seed + i) % (i + 1);
                    [options[i], options[j]] = [options[j], options[i]];
                  }

                  return options.map((optionText: string, index: number) => {
                    const isSelected = answers.get(question.id) === optionText;
                    const label = String.fromCharCode(65 + index); // A, B, C, D
                    
                    return (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onMouseEnter={() => playPop()}
                        key={index}
                        onClick={() => handleOptionSelect(optionText)}
                        className={`w-full text-left flex items-center p-3 md:p-5 rounded-3xl border-4 transition-all duration-200 relative
                          ${isSelected 
                            ? 'border-primary bg-primary/10 translate-y-1 shadow-none scale-102 ring-4 ring-primary/20' 
                            : 'bg-surface border-surface-dark border-b-8 hover:brightness-105'
                          }`}
                      >
                        <span className={`w-10 h-10 md:w-14 md:h-14 flex-shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl text-base md:text-xl font-black mr-3 md:mr-5 border-4
                          ${isSelected ? 'bg-primary border-primary-dark text-white' : 'bg-surface-dark border-sky-200 text-sky-700'}
                        `}>
                          {label}
                        </span>
                        <div 
                          className={`flex-1 prose max-w-none text-base md:text-2xl font-bold ${isSelected ? 'text-primary-dark' : 'text-foreground'}`}
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="ml-4 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  });
                })()}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 sm:gap-0">
          <Button
            variant="cartoon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-full sm:w-32 rounded-3xl font-black py-4 text-xl ${currentIndex === 0 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-6 h-6 mr-1 font-black" /> Back
          </Button>
          
          {isLastQuestion ? (
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-full sm:w-auto"
            >
              <Button
                variant="gameAction"
                onClick={() => handleSubmitStage(false)}
                disabled={!canSubmit || submitting}
                className="w-full sm:w-56 rounded-3xl font-black text-2xl py-6 border-4 border-primary-dark overflow-hidden relative"
              >
                {submitting ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">Finish Stage! <Flag className="w-7 h-7" /></span>
                )}
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="cartoon"
              onClick={handleNext}
              className="w-full sm:w-32 rounded-3xl font-black py-4 text-xl bg-sky-400 text-white border-sky-600 hover:bg-sky-500"
            >
              Next <ChevronRight className="w-6 h-6 ml-1 font-black" />
            </Button>
          )}
        </div>
      </main>

      {/* Stage Complete Interstitial Modal */}
      <Modal isOpen={showInterstitial} onClose={() => {}} title="" showCloseButton={false} variant="celebration">
        <div className="text-center p-6 relative overflow-hidden">
          <FloatingSparkles count={8} />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
            className="mx-auto w-32 h-32 mb-6 relative z-10"
          >
            <CartoonFox mood="celebrating" size="lg" />
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tight">
            LEVEL {currentStage} COMPLETE!
          </h2>
          
          <div className="flex justify-center mb-8">
            <StarRating 
              rating={stageResult?.stage_score ? (stageResult.stage_score < 5 ? 1 : stageResult.stage_score <= 8 ? 2 : 3) : 0} 
              maxStars={3} 
              size="lg" 
            />
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border-4 border-white rounded-3xl p-6 mb-10 shadow-xl inline-block w-full max-w-sm relative z-10">
            <span className="text-lg font-black text-slate-400 uppercase tracking-widest block mb-2">Score</span>
            <div className="text-6xl font-black text-slate-800">
              {stageResult?.stage_score} <span className="text-4xl text-slate-400">/ 10!</span>
            </div>
            
            <div className="mt-6 w-full bg-slate-100 rounded-full h-6 border-4 border-slate-200 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((stageResult?.stage_score || 0) / 10) * 100}%` }}
                transition={{ duration: 1, delay: 0.5, type: 'spring' }}
                className="bg-primary h-full rounded-full"
              />
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
            <Button 
              variant="gameAction"
              size="lg"
              className="w-full text-2xl font-black py-6 rounded-3xl shadow-xl" 
              onClick={handleContinue}
            >
              {currentStage >= 5 ? 'See Your Trophy!' : `Next Level`}
            </Button>
          </motion.div>
        </div>
      </Modal>
    </div>
  );
}
