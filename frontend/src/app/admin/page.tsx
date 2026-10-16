'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Target, 
  History, 
  ArrowRight, 
  Clock, 
  BrainCircuit, 
  Award,
  ChevronRight,
  Eye,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/lib/api/client';
import { Badge } from '@/components/ui/Badge';

interface RecentSession {
  id: string;
  session_id: number;
  type: 'practice' | 'past_question';
  student_id: number;
  student_name: string;
  student_email: string;
  subject_name: string;
  level: string;
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  status: string;
  completed_at: string;
}

interface Stats {
  total_schools?: number;
  total_students?: number;
  total_confirmed_users?: number;
  total_quizzes?: number;
  average_score?: number;
  total_questions_attempted?: number;
  recent_sessions?: RecentSession[];
  school_name?: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (['admin', 'root_admin'].includes(user?.role || '')) {
          const res = await api.get('/auth/schools/stats/');
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-[var(--surface-light)] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[var(--surface-light)] rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-[var(--surface-light)] rounded-xl" />
      </div>
    );
  }

  const isAdmin = ['admin', 'root_admin'].includes(user?.role || '');

  return (
    <div className="space-y-8" role="main" aria-label="Admin Dashboard Overview">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Overview</h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'Global Platform Analytics & Student Results History' : `Statistics for ${stats?.school_name || 'your dashboard'}`}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/student-results"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-sm shadow-md hover:bg-primary-600 transition-all"
          >
            <History size={16} />
            <span>All Student Results & History</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Platform Stats">
        {isAdmin && (
          <article className="glass-card p-6 border-l-4 border-l-secondary-500 rounded-xl" aria-label="Total Schools">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Schools</h3>
              <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-400">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{stats?.total_schools || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Registered institutions</p>
          </article>
        )}

        <article className="glass-card p-6 border-l-4 border-l-primary-500 rounded-xl" aria-label="Total Users">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Users</h3>
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats?.total_students || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Students & staff accounts</p>
        </article>

        <article className="glass-card p-6 border-l-4 border-l-emerald-500 rounded-xl" aria-label="Total Quizzes Taken">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Quizzes Completed</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats?.total_quizzes || 0}</p>
          <p className="text-xs text-emerald-500 font-medium mt-1">Practice + Past Question sessions</p>
        </article>

        <article className="glass-card p-6 border-l-4 border-l-amber-500 rounded-xl" aria-label="Platform Average Score">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Average Platform Score</h3>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats?.average_score || 0}%</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.total_questions_attempted || 0} questions attempted</p>
        </article>
      </section>

      {/* Live Recent Quiz Attempts Feed */}
      {isAdmin && stats?.recent_sessions && stats.recent_sessions.length > 0 && (
        <section className="glass-card rounded-2xl overflow-hidden border border-[var(--surface-dark)] shadow-md">
          <div className="p-6 border-b border-[var(--surface-dark)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                Live Student Quiz Activity & Results
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Real-time stream of practice quizzes and past examination attempts taken by students.
              </p>
            </div>
            <Link
              href="/admin/student-results"
              className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 group"
            >
              <span>View full history</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)] text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Subject & Level</th>
                  <th className="p-4 text-center">Score %</th>
                  <th className="p-4 text-center">Correct / Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Time</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                {stats.recent_sessions.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      <div>
                        <span>{item.student_name}</span>
                        <span className="block text-xs font-normal text-gray-500">{item.student_email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.type === 'practice' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <BookOpen size={12} /> Practice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          <BrainCircuit size={12} /> Past Question
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {item.subject_name}
                      <span className="block text-xs text-gray-500">{item.level}</span>
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
                      {new Date(item.completed_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/student-results?student_id=${item.student_id}&review_session=${item.session_id}&review_type=${item.type}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-bold transition-all"
                        title="Review questions and student answers"
                      >
                        <Eye size={12} />
                        <span>Review</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* User Verification Status Chart */}
      {isAdmin && stats && (
        <section className="glass-card p-6 rounded-xl" aria-label="User Statistics Chart">
          <h2 className="text-xl font-bold mb-6 text-foreground">User Verification Status</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Confirmed Users', value: stats.total_confirmed_users || 0 },
                    { name: 'Unconfirmed Users', value: Math.max(0, (stats.total_students || 0) - (stats.total_confirmed_users || 0)) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-dark)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
