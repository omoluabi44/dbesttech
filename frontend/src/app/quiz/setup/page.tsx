'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { startPractice, getSubjects } from '@/lib/api/quiz';
import { useQuizStore } from '@/lib/stores/quizStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { Subject } from '@/lib/types/quiz';
import { toast } from 'sonner';
import { Loader2, Lock, BookOpen, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { CartoonFox } from '@/components/cartoon/CartoonFox';
import { FloatingClouds, FloatingSparkles } from '@/components/cartoon/FloatingElements';
import { StarRating } from '@/components/cartoon/CartoonStars';
import { SpeechBubble } from '@/components/cartoon/SpeechBubble';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';


const DIFFICULTIES = [
  { id: 'easy', label: 'Beginner', stars: 1, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-400' },
  { id: 'medium', label: 'Explorer', stars: 2, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-400' },
  { id: 'hard', label: 'Champion', stars: 3, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-400' },
] as const;

function QuizSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectQuery = searchParams.get('subject');

  const { user } = useAuthStore();
  const { startPractice: startStorePractice } = useQuizStore();
  const { playPop, playButtonClick, speakEncouragement } = useSoundEffects();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [starting, setStarting] = useState(false);
  const [foxMood, setFoxMood] = useState<'waving' | 'happy' | 'celebrating'>('waving');

  useEffect(() => {
    let mounted = true;
    const fetchSubjects = async () => {
      try {
        const data = await getSubjects();
        if (mounted) {
          const list = Array.isArray(data) ? data : (data?.results || []);
          setSubjects(list);
          if (subjectQuery) {
            const found = list.find((s: Subject) => String(s.id) === String(subjectQuery));
            if (found) {
              setSelectedSubject(found.id);
              setFoxMood('happy');
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          toast.error('Failed to load subjects');
          setLoading(false);
        }
      }
    };
    fetchSubjects();

    // Speak on load
    const timer = setTimeout(() => {
      if (mounted) speakEncouragement('quizStart');
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [speakEncouragement]);

  const handleSubjectSelect = (id: number) => {
    playPop();
    setSelectedSubject(id);
    setFoxMood('happy');
  };

  const handleDifficultySelect = (diff: typeof selectedDifficulty, isLocked: boolean, requiresUpgrade: boolean = false) => {
    if (requiresUpgrade) {
      toast.error('Upgrade your plan to unlock medium and hard difficulties!');
      return;
    }
    if (isLocked) {
      toast.error('Complete the lower level first to unlock this difficulty!');
      return;
    }
    playButtonClick();
    setSelectedDifficulty(diff);
  };

  const handleStart = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject first!');
      return;
    }

    const studentLevel = user?.student_profile?.level || 'primary_1';

    setStarting(true);
    setFoxMood('celebrating');
    speakEncouragement('quizStart');

    try {
      const res = await startPractice({
        subject_id: selectedSubject,
        level: studentLevel,
        difficulty: selectedDifficulty,
      });
      startStorePractice(res.session, res.questions);
      router.push(`/quiz/session/${res.session.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start adventure');
      setStarting(false);
      setFoxMood('happy');
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background rounded-xl">
        <FloatingClouds count={6} />
        <FloatingSparkles count={15} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-black text-indigo-900 drop-shadow-md mb-4 tracking-tight">
                Choose Your Adventure!
              </h1>
              <p className="text-xl text-indigo-700 font-bold bg-white/50 inline-block px-4 py-2 rounded-full border-2 border-indigo-200">
                Pick a world to explore and test your skills
              </p>
            </div>
            
            <div className="relative w-48 h-48 flex-shrink-0">
              <SpeechBubble 
                text={selectedSubject ? "Great choice! Ready to go?" : "Pick a subject to play!"}
                position="left"
                className="absolute -top-4 -left-2 sm:-left-12 z-20 shadow-xl"
                variant="shout"
              />
              <CartoonFox mood={foxMood} size="lg" className="drop-shadow-2xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subject Selection Dropdown */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                  <span className="bg-yellow-400 text-yellow-900 w-9 h-9 rounded-full flex items-center justify-center shadow-md text-lg font-black">1</span>
                  Choose Subject
                </h2>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                  Step 1 of 2
                </span>
              </div>

              {/* Subject Selection Dropdown Container */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border-4 border-indigo-200 shadow-lg space-y-5">
                <div>
                  <label htmlFor="subject-select" className="block text-sm font-bold text-indigo-900 mb-2">
                    Select a Quiz Subject:
                  </label>
                  <div className="relative">
                    <select
                      id="subject-select"
                      value={selectedSubject ? String(selectedSubject) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleSubjectSelect(Number(val));
                        } else {
                          setSelectedSubject(null);
                        }
                      }}
                      className="w-full appearance-none bg-indigo-50/70 border-3 border-indigo-300 hover:border-indigo-500 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200 rounded-xl px-5 py-4 text-indigo-950 font-bold transition-all cursor-pointer text-lg pr-12 shadow-inner"
                    >
                      <option value="">-- Click to Select Subject --</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                      <ChevronDown size={24} className="stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Quick Subject Chips */}
                {subjects.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-indigo-100">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      Or quick select:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => {
                        const isSelected = selectedSubject === subject.id;
                        return (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => handleSubjectSelect(subject.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border-2 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105'
                                : 'bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200 hover:border-indigo-300 shadow-sm'
                            }`}
                          >
                            <BookOpen size={16} />
                            <span>{subject.name}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-yellow-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Subject Preview Card */}
                {currentSubject ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-3 border-indigo-300 shadow-sm flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <BookOpen size={36} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 className="text-2xl font-black text-indigo-950">
                          {currentSubject.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Ready to Play
                        </span>
                      </div>
                      <p className="text-sm text-indigo-800 font-medium">
                        {currentSubject.description || 'Practice multiple choice questions and test your skills!'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 rounded-2xl bg-indigo-50/50 border-2 border-dashed border-indigo-200 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="text-base font-bold text-indigo-900">
                      Choose a subject from the dropdown above
                    </h4>
                    <p className="text-xs text-indigo-600 max-w-sm mx-auto">
                      Select Mathematics or English to unlock difficulty levels and launch your adventure!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-8">
              {/* Difficulty Selection */}
              <AnimatePresence>
                {selectedSubject && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                      <span className="bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center shadow-md">2</span>
                      Choose Level
                    </h2>
                    
                    <div className="flex flex-col gap-3">
                      {DIFFICULTIES.map((diff) => {
                        const isFree = !user?.subscription_plan || user.subscription_plan === 'free';
                        const requiresUpgrade = isFree && (diff.id === 'medium' || diff.id === 'hard');
                        const isUnlocked = (!currentSubject?.unlocked_difficulties || currentSubject.unlocked_difficulties.includes(diff.id)) && !requiresUpgrade;
                        const isSelected = selectedDifficulty === diff.id;
                        
                        return (
                          <motion.button
                            key={diff.id}
                            whileHover={isUnlocked ? { scale: 1.02 } : {}}
                            whileTap={isUnlocked ? { scale: 0.98 } : {}}
                            onClick={() => handleDifficultySelect(diff.id, !isUnlocked, requiresUpgrade)}
                            className={`relative overflow-hidden rounded-xl border-4 p-4 flex items-center justify-between transition-all ${
                              isSelected
                                ? `${diff.border} ${diff.bg} shadow-md`
                                : isUnlocked
                                  ? 'border-gray-200 bg-white hover:border-indigo-300'
                                  : 'border-gray-200 bg-gray-100 opacity-70 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className={`font-bold text-lg ${isSelected ? diff.color : 'text-gray-700'}`}>
                                {diff.label}
                              </span>
                              <StarRating rating={diff.stars} maxStars={3} size="sm" />
                            </div>
                            
                            {!isUnlocked && (
                              <div className="absolute right-4 text-gray-400" title={requiresUpgrade ? "Upgrade your plan to unlock!" : "Complete lower level first!"}>
                                <Lock className="w-6 h-6" />
                              </div>
                            )}
                            
                            {isSelected && (
                              <motion.div 
                                layoutId="activeDiff"
                                className={`absolute inset-0 border-4 ${diff.border} rounded-xl`}
                                style={{ pointerEvents: 'none' }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Start Button Area */}
              <AnimatePresence>
                {selectedSubject && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-4"
                  >
                    <Button
                      onClick={handleStart}
                      disabled={starting}
                      className="w-full text-2xl py-8 rounded-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-white shadow-[0_8px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-1 transition-all border-4 border-white active:shadow-none active:translate-y-2 uppercase tracking-wider"
                    >
                      {starting ? (
                        <span className="flex items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          PREPARING...
                        </span>
                      ) : (
                        <motion.span 
                          animate={{ scale: [1, 1.05, 1] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          START ADVENTURE! 🚀
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* How it works */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-4 border-indigo-200 shadow-sm mt-8">
                <h3 className="font-bold text-indigo-900 mb-4 text-lg">How to play:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-indigo-800 font-medium">
                    <span className="bg-pink-300 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                    Pick a fun world
                  </li>
                  <li className="flex items-center gap-3 text-indigo-800 font-medium">
                    <span className="bg-blue-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">2</span>
                    Choose your challenge level
                  </li>
                  <li className="flex items-center gap-3 text-indigo-800 font-medium">
                    <span className="bg-green-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">3</span>
                    Answer questions & win points!
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function QuizSetupPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        </DashboardLayout>
      }
    >
      <QuizSetupContent />
    </Suspense>
  );
}
