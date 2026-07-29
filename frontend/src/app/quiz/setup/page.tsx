'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { startPractice, getSubjects } from '@/lib/api/quiz';
import { useQuizStore } from '@/lib/stores/quizStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { Subject } from '@/lib/types/quiz';
import { toast } from 'sonner';
import { Loader2, Lock, BookOpen } from 'lucide-react';
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

export default function QuizSetupPage() {
  const router = useRouter();
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
          setSubjects(data.results);
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

  const handleDifficultySelect = (diff: typeof selectedDifficulty, isLocked: boolean) => {
    if (isLocked) {
      toast.error('Complete the lower level first to unlock this difficulty!');
      return;
    }
    playButtonClick();
    setSelectedDifficulty(diff);
  };

  const handleStart = async () => {
    if (!selectedSubject || !user?.student_profile?.level) {
      toast.error('Please select a subject first!');
      return;
    }

    setStarting(true);
    setFoxMood('celebrating');
    speakEncouragement('quizStart');

    try {
      const res = await startPractice({
        subject_id: selectedSubject,
        level: user.student_profile.level,
        difficulty: selectedDifficulty,
      });
      startStorePractice(res.session, res.questions);
      router.push(`/quiz/session/${res.session.id}`);
    } catch (error) {
      toast.error('Failed to start adventure');
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
            {/* Subject Selection */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                <span className="bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center shadow-md">1</span>
                Select a World
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {subjects.map((subject) => {
                  const isSelected = selectedSubject === subject.id;
                  
                  return (
                    <motion.div
                      key={subject.id}
                      whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubjectSelect(subject.id)}
                      className={`cursor-pointer rounded-2xl border-4 p-4 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 min-h-[160px] ${
                        isSelected 
                          ? 'border-primary shadow-sm bg-primary/10 transform scale-105' 
                          : `bg-surface border-surface-dark shadow-sm hover:shadow-md opacity-90 hover:opacity-100`
                      }`}
                    >
                      <div className="text-primary drop-shadow-sm">
                        <BookOpen size={48} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800">{subject.name}</h3>
                        {subject.description && (
                          <p className="text-sm text-gray-700 font-medium line-clamp-2 mt-1">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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
                        const isUnlocked = !currentSubject?.unlocked_difficulties || currentSubject.unlocked_difficulties.includes(diff.id);
                        const isSelected = selectedDifficulty === diff.id;
                        
                        return (
                          <motion.button
                            key={diff.id}
                            whileHover={isUnlocked ? { scale: 1.02 } : {}}
                            whileTap={isUnlocked ? { scale: 0.98 } : {}}
                            onClick={() => handleDifficultySelect(diff.id, !isUnlocked)}
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
                              <div className="absolute right-4 text-gray-400" title="Complete lower level first!">
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
