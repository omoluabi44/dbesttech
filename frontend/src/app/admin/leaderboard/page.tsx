'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Flame, 
  Target, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import api from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/utils/formatters';
import { LeaderboardEntry, AvailableLevel, AvailableSubject } from '@/lib/types/performance';

interface AdminLeaderboardResponse {
  level: string;
  level_display: string;
  subject_id: number | null;
  subject_name: string;
  leaderboard: LeaderboardEntry[];
  total_participants: number;
  available_levels: AvailableLevel[];
  available_subjects: AvailableSubject[];
}

function AdminLeaderboardContent() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [data, setData] = useState<AdminLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedLevel && selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }
      if (selectedSubject && selectedSubject !== 'all') {
        params.append('subject_id', selectedSubject);
      }
      params.append('limit', '100');

      const res = await api.get(`/performance/admin/leaderboard/?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin leaderboard', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedSubject]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const leaderboard = data?.leaderboard || [];
  const availableLevels = data?.available_levels || [];
  const availableSubjects = data?.available_subjects || [];

  const filteredLeaderboard = leaderboard.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.student_name.toLowerCase().includes(query) ||
           item.level_display.toLowerCase().includes(query) ||
           item.level.toLowerCase().includes(query);
  });

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Group levels for dropdown
  const primaryLevels = availableLevels.filter(l => l.code.startsWith('primary_'));
  const juniorLevels = availableLevels.filter(l => l.code.startsWith('jss_'));
  const seniorLevels = availableLevels.filter(l => l.code.startsWith('ss_'));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="text-amber-500 w-8 h-8" />
            Global Platform Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Analyze top student achievements across all class levels or filter by specific grades and subjects.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--surface-dark)] shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Level Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-primary-500" />
              School / Class Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setSelectedSubject('all');
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">🌐 All School Levels (Global)</option>
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

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary-500" />
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">🌟 All Subjects (Combined)</option>
              {availableSubjects.map((sub) => (
                <option key={sub.id} value={sub.id.toString()}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Search size={14} className="text-primary-500" />
              Search Student
            </label>
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--surface-dark)] pt-4 gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <span>Viewing:</span>
            <span className="font-bold text-foreground">
              {data?.level_display || 'All Levels'} &bull; {data?.subject_name || 'All Subjects'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Total Ranked Students:</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 font-bold">
              {data?.total_participants || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!loading && leaderboard.length === 0 && (
        <div className="glass-card p-12 text-center rounded-2xl border border-[var(--surface-dark)]">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No Leaderboard Data</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            No completed quizzes recorded yet for {data?.level_display} in {data?.subject_name}.
          </p>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          {/* Rank 2 (Silver) */}
          {top2 ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-300 dark:border-slate-700 text-center relative shadow-md">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Medal className="w-7 h-7 text-slate-400" />
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 text-foreground font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                {top2.student_name[0]?.toUpperCase()}
              </div>
              <Badge variant="default" size="sm" className="mb-2">#2 Silver</Badge>
              <h3 className="font-bold text-base truncate">{top2.student_name}</h3>
              <p className="text-xs text-gray-500 mb-3">{top2.level_display}</p>
              <div className="bg-[var(--surface-light)] py-2 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Points</span>
                <span className="text-lg font-black text-foreground flex items-center justify-center gap-1">
                  <Flame size={14} className="text-amber-500" />
                  {top2.total_correct_answers}
                </span>
              </div>
              <Link
                href={`/admin/student-results?student_id=${top2.student_id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:underline"
              >
                Inspect Results <ArrowUpRight size={12} />
              </Link>
            </div>
          ) : <div />}

          {/* Rank 1 (Gold - Taller) */}
          {top1 && (
            <div className="glass-card p-7 rounded-2xl border-2 border-amber-400 text-center relative shadow-xl md:-translate-y-3 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <Crown className="w-9 h-9 text-amber-500 fill-amber-400" />
              </div>
              <div className="w-20 h-20 rounded-full bg-amber-400 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-amber-300">
                {top1.student_name[0]?.toUpperCase()}
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm mb-2">
                #1 Champion
              </span>
              <h3 className="font-black text-lg truncate">{top1.student_name}</h3>
              <p className="text-xs text-gray-500 mb-4">{top1.level_display}</p>
              <div className="bg-[var(--surface-light)] py-3 rounded-xl text-center border border-amber-300/30">
                <span className="text-[11px] text-amber-500 uppercase font-extrabold block">Top Points</span>
                <span className="text-2xl font-black text-foreground flex items-center justify-center gap-1">
                  <Flame size={18} className="text-amber-500" />
                  {top1.total_correct_answers}
                </span>
              </div>
              <Link
                href={`/admin/student-results?student_id=${top1.student_id}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:underline"
              >
                Inspect Results <ArrowUpRight size={14} />
              </Link>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 ? (
            <div className="glass-card p-6 rounded-2xl border border-amber-700/30 text-center relative shadow-md">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Award className="w-7 h-7 text-amber-700" />
              </div>
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950 text-foreground font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                {top3.student_name[0]?.toUpperCase()}
              </div>
              <Badge variant="default" size="sm" className="mb-2">#3 Bronze</Badge>
              <h3 className="font-bold text-base truncate">{top3.student_name}</h3>
              <p className="text-xs text-gray-500 mb-3">{top3.level_display}</p>
              <div className="bg-[var(--surface-light)] py-2 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Points</span>
                <span className="text-lg font-black text-foreground flex items-center justify-center gap-1">
                  <Flame size={14} className="text-amber-500" />
                  {top3.total_correct_answers}
                </span>
              </div>
              <Link
                href={`/admin/student-results?student_id=${top3.student_id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:underline"
              >
                Inspect Results <ArrowUpRight size={12} />
              </Link>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Full Leaderboard Table */}
      {!loading && filteredLeaderboard.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--surface-dark)] shadow-md">
          <div className="p-4 border-b border-[var(--surface-dark)] flex justify-between items-center">
            <h3 className="font-bold text-base">Rankings Table</h3>
            <span className="text-xs text-gray-500">Showing {filteredLeaderboard.length} students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Class Level</th>
                  <th className="p-4 text-center">Points (Correct)</th>
                  <th className="p-4 text-center">Accuracy %</th>
                  <th className="p-4 text-center">Quizzes</th>
                  <th className="p-4 text-center">Time Spent</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                {filteredLeaderboard.map((entry) => (
                  <tr key={entry.student_id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4 text-center">
                      {entry.rank === 1 && <span className="text-lg">🥇</span>}
                      {entry.rank === 2 && <span className="text-lg">🥈</span>}
                      {entry.rank === 3 && <span className="text-lg">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="font-black text-xs text-gray-400">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 font-bold flex items-center justify-center text-xs">
                          {entry.student_name[0]?.toUpperCase()}
                        </div>
                        <span>{entry.student_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                      {entry.level_display}
                    </td>
                    <td className="p-4 text-center font-black text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Flame size={14} className="text-amber-500" />
                        {entry.total_correct_answers}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-500">
                      {entry.accuracy_rate}%
                    </td>
                    <td className="p-4 text-center font-medium text-gray-500">
                      {entry.total_quizzes_taken}
                    </td>
                    <td className="p-4 text-center text-xs text-gray-400">
                      {formatTime(entry.total_time_spent_seconds)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/student-results?student_id=${entry.student_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-bold transition-all"
                      >
                        Results <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-[var(--surface-light)] rounded-xl" />
        <div className="h-32 bg-[var(--surface-light)] rounded-2xl" />
        <div className="h-64 bg-[var(--surface-light)] rounded-2xl" />
      </div>
    }>
      <AdminLeaderboardContent />
    </Suspense>
  );
}
