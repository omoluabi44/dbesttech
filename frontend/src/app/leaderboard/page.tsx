"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Target, 
  BookOpen, 
  Users, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';
import { getLeaderboard } from '@/lib/api/performance';
import { formatTime } from '@/lib/utils/formatters';
import { LeaderboardEntry } from '@/lib/types/performance';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const userLevel = user?.student_profile?.level || 'primary_1';

  const [selectedLevel, setSelectedLevel] = useState<string>(userLevel);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Update selected level when user profile loads
  useEffect(() => {
    if (user?.student_profile?.level) {
      setSelectedLevel(user.student_profile.level);
    }
  }, [user?.student_profile?.level]);

  // Reset subject filter when class level changes
  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    setSelectedSubject('all');
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', selectedLevel, selectedSubject],
    queryFn: () => getLeaderboard(selectedLevel, selectedSubject === 'all' ? undefined : selectedSubject),
  });

  const leaderboard = data?.leaderboard || [];
  const currentUserRank = data?.current_user_rank;
  const availableLevels = data?.available_levels || [];
  const availableSubjects = data?.available_subjects || [];

  // Top 3 for podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const restOfLeaderboard = leaderboard.slice(3);

  // Group levels into categories for nice dropdown display
  const primaryLevels = availableLevels.filter(l => l.code.startsWith('primary_'));
  const juniorLevels = availableLevels.filter(l => l.code.startsWith('jss_'));
  const seniorLevels = availableLevels.filter(l => l.code.startsWith('ss_'));

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-8 sm:p-10 shadow-xl border-4 border-amber-300/40">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-extrabold uppercase tracking-widest mb-3">
                <Sparkles size={14} className="text-yellow-200" />
                Champions Arena
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Trophy className="text-yellow-300 w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md" />
                Class Leaderboard
              </h1>
              <p className="mt-2 text-amber-100 max-w-xl text-sm sm:text-base font-medium">
                Compete with your peers in your class level and see who achieves the highest scores and accuracy across all subjects!
              </p>
            </div>

            {/* Quick Action */}
            <Link
              href="/quiz/setup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-orange-600 font-extrabold shadow-lg hover:bg-orange-50 hover:scale-105 transition-all text-sm shrink-0 border-b-4 border-orange-200"
            >
              <Flame className="w-5 h-5 text-orange-500" />
              Practice & Climb Rank
            </Link>
          </div>

          {/* Background decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-40 top-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-6 border-slate-200 shadow-md bg-white rounded-3xl">
          <div className="flex flex-col sm:flex-row gap-5 items-stretch sm:items-center justify-between">
            {/* Level Filter */}
            <div className="flex-1">
              <label htmlFor="level-select" className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={14} className="text-primary" />
                Class Level
              </label>
              <select
                id="level-select"
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold text-sm focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer shadow-sm"
              >
                {primaryLevels.length > 0 && (
                  <optgroup label="Primary School">
                    {primaryLevels.map(lvl => (
                      <option key={lvl.code} value={lvl.code}>{lvl.label}</option>
                    ))}
                  </optgroup>
                )}
                {juniorLevels.length > 0 && (
                  <optgroup label="Junior Secondary">
                    {juniorLevels.map(lvl => (
                      <option key={lvl.code} value={lvl.code}>{lvl.label}</option>
                    ))}
                  </optgroup>
                )}
                {seniorLevels.length > 0 && (
                  <optgroup label="Senior Secondary">
                    {seniorLevels.map(lvl => (
                      <option key={lvl.code} value={lvl.code}>{lvl.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="flex-1">
              <label htmlFor="subject-select" className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                Subject
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold text-sm focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer shadow-sm"
              >
                <option value="all">🌟 All Subjects (Combined)</option>
                {availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id.toString()}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Total count badge */}
            <div className="sm:self-end pb-1 text-center sm:text-right">
              <span className="text-xs font-bold text-slate-400 block mb-1">Participants</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-sm border border-slate-200">
                <Users size={14} className="text-slate-500" />
                {data?.total_participants || 0} Students
              </span>
            </div>
          </div>
        </Card>

        {/* Current User Standing Card */}
        {currentUserRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-primary-light via-blue-50 to-indigo-50 border-2 border-primary/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex flex-col items-center justify-center font-extrabold shadow-md border-b-4 border-primary-dark shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Rank</span>
                <span className="text-xl leading-none">#{currentUserRank.rank}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">Your Standing</h3>
                  <Badge variant="success" size="sm">You</Badge>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {currentUserRank.level_display} &bull; {data?.subject_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 self-stretch sm:self-auto justify-around sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-primary/10">
              <div className="text-center sm:text-right">
                <span className="text-xs font-bold text-slate-500 block">Total Points</span>
                <span className="text-lg font-extrabold text-primary flex items-center justify-center sm:justify-end gap-1">
                  <Flame size={16} className="text-amber-500" />
                  {currentUserRank.total_correct_answers}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-xs font-bold text-slate-500 block">Accuracy</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {currentUserRank.accuracy_rate}%
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-xs font-bold text-slate-500 block">Quizzes</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {currentUserRank.total_quizzes_taken}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <Skeleton className="h-64 rounded-3xl" />
              <Skeleton className="h-72 rounded-3xl" />
              <Skeleton className="h-60 rounded-3xl" />
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && leaderboard.length === 0 && (
          <Card className="p-12 text-center border-slate-200 shadow-sm rounded-3xl bg-white">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border-2 border-amber-200">
              <Trophy size={40} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">No Rankings Yet!</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 font-medium">
              No students in <span className="font-bold text-slate-700">{data?.level_display}</span> have completed quizzes in{' '}
              <span className="font-bold text-slate-700">{data?.subject_name}</span> yet.
            </p>
            <Link
              href="/quiz/setup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-extrabold text-sm border-b-4 border-primary-dark shadow-md hover:scale-105 transition-all"
            >
              <Sparkles size={16} />
              Be the First to Take a Quiz!
            </Link>
          </Card>
        )}

        {/* Top 3 Podium (Only if we have at least 1 entry) */}
        {!isLoading && leaderboard.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-amber-500 w-6 h-6" />
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Top Champions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
              {/* 2nd Place (Silver) */}
              {top2 ? (
                <PodiumCard entry={top2} rank={2} color="silver" />
              ) : (
                <EmptyPodiumSlot rank={2} />
              )}

              {/* 1st Place (Gold - Taller) */}
              {top1 ? (
                <PodiumCard entry={top1} rank={1} color="gold" isFirst />
              ) : null}

              {/* 3rd Place (Bronze) */}
              {top3 ? (
                <PodiumCard entry={top3} rank={3} color="bronze" />
              ) : (
                <EmptyPodiumSlot rank={3} />
              )}
            </div>
          </div>
        )}

        {/* Full Rankings Table (Rank 4 and beyond, or all if preferred) */}
        {!isLoading && leaderboard.length > 0 && (
          <Card className="border-slate-200 shadow-md rounded-3xl overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Overall Standings</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing top performers in {data?.level_display} ({data?.subject_name})
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6 text-center">Points (Correct)</th>
                    <th className="py-4 px-6 text-center">Accuracy</th>
                    <th className="py-4 px-6 text-center">Quizzes</th>
                    <th className="py-4 px-6 text-center">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {leaderboard.map((entry) => {
                    const isUser = entry.is_current_user;
                    return (
                      <tr
                        key={entry.student_id}
                        className={`transition-colors font-medium ${
                          isUser
                            ? 'bg-primary-light/50 font-bold hover:bg-primary-light/70'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-4 px-6 text-center">
                          {entry.rank === 1 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-black text-sm shadow-sm border border-amber-300">
                              🥇
                            </span>
                          )}
                          {entry.rank === 2 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-black text-sm shadow-sm border border-slate-300">
                              🥈
                            </span>
                          )}
                          {entry.rank === 3 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-amber-700 font-black text-sm shadow-sm border border-orange-300">
                              🥉
                            </span>
                          )}
                          {entry.rank > 3 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs">
                              #{entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Student Name & Avatar */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-dark text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {entry.avatar_url ? (
                                <img
                                  src={entry.avatar_url}
                                  alt={entry.student_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                entry.student_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-slate-900 ${isUser ? 'font-extrabold text-primary' : 'font-bold'}`}>
                                  {entry.student_name}
                                </span>
                                {isUser && <Badge variant="success" size="sm">You</Badge>}
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                {entry.level_display}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Points / Correct Answers */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 font-extrabold text-slate-900">
                            <Flame size={15} className="text-amber-500" />
                            {entry.total_correct_answers}
                          </span>
                        </td>

                        {/* Accuracy Rate */}
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            entry.accuracy_rate >= 80 ? 'text-emerald-600' : entry.accuracy_rate >= 50 ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            <Target size={14} className="opacity-70" />
                            {entry.accuracy_rate}%
                          </span>
                        </td>

                        {/* Quizzes Taken */}
                        <td className="py-4 px-6 text-center text-slate-600 font-bold">
                          {entry.total_quizzes_taken}
                        </td>

                        {/* Time Spent */}
                        <td className="py-4 px-6 text-center text-slate-500 text-xs font-semibold">
                          {formatTime(entry.total_time_spent_seconds)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// -------------------------------------------------------------
// Helper Components: Podium Cards
// -------------------------------------------------------------

function PodiumCard({ 
  entry, 
  rank, 
  color, 
  isFirst = false 
}: { 
  entry: LeaderboardEntry; 
  rank: number; 
  color: 'gold' | 'silver' | 'bronze'; 
  isFirst?: boolean;
}) {
  const colorStyles = {
    gold: {
      border: 'border-yellow-400',
      bg: 'bg-gradient-to-b from-amber-50 via-white to-amber-50/30',
      badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
      accent: 'text-amber-500',
      shadow: 'shadow-yellow-100',
      crown: <Crown className="w-8 h-8 text-amber-500 fill-amber-400 animate-bounce" />
    },
    silver: {
      border: 'border-slate-300',
      bg: 'bg-gradient-to-b from-slate-50 via-white to-slate-50/30',
      badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
      accent: 'text-slate-600',
      shadow: 'shadow-slate-100',
      crown: <Medal className="w-6 h-6 text-slate-500" />
    },
    bronze: {
      border: 'border-amber-700/30',
      bg: 'bg-gradient-to-b from-orange-50/50 via-white to-orange-50/20',
      badge: 'bg-gradient-to-r from-amber-700 to-orange-600 text-white',
      accent: 'text-amber-700',
      shadow: 'shadow-orange-100',
      crown: <Award className="w-6 h-6 text-amber-700" />
    }
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`relative rounded-3xl border-4 ${colorStyles.border} ${colorStyles.bg} p-6 text-center shadow-lg ${colorStyles.shadow} flex flex-col items-center justify-between ${
        isFirst ? 'md:-translate-y-4 md:py-8 border-yellow-400 shadow-xl' : ''
      }`}
    >
      {/* Top Medal/Crown Indicator */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center">
        {colorStyles.crown}
      </div>

      <div className="w-full flex flex-col items-center mt-2">
        {/* Avatar */}
        <div className="relative mb-3">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-primary-dark text-white font-extrabold text-2xl flex items-center justify-center border-4 ${colorStyles.border} shadow-md overflow-hidden`}>
            {entry.avatar_url ? (
              <img src={entry.avatar_url} alt={entry.student_name} className="w-full h-full object-cover" />
            ) : (
              entry.student_name.charAt(0).toUpperCase()
            )}
          </div>
          <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm ${colorStyles.badge}`}>
            #{rank}
          </span>
        </div>

        {/* Student Name */}
        <h4 className="font-extrabold text-slate-900 text-base mt-2 line-clamp-1">
          {entry.student_name}
        </h4>
        <p className="text-xs font-bold text-slate-400 mb-4">{entry.level_display}</p>

        {/* Points Banner */}
        <div className="w-full bg-white/80 border border-slate-200/80 rounded-2xl py-3 px-4 shadow-sm mb-4">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Total Points
          </span>
          <span className="text-2xl font-black text-slate-900 flex items-center justify-center gap-1.5 mt-0.5">
            <Flame className="text-amber-500 w-5 h-5" />
            {entry.total_correct_answers}
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase">Accuracy</span>
            <span className="font-extrabold text-slate-800">{entry.accuracy_rate}%</span>
          </div>
          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase">Quizzes</span>
            <span className="font-extrabold text-slate-800">{entry.total_quizzes_taken}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyPodiumSlot({ rank }: { rank: number }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center opacity-60">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-extrabold text-lg mb-3">
        #{rank}
      </div>
      <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Slot Available</p>
      <p className="text-[11px] text-slate-400 mt-1 font-medium">Take a quiz to claim this spot!</p>
    </div>
  );
}
