'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useEffect, useState } from 'react';
import { GraduationCap, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/lib/api/client';

interface Stats {
  total_schools?: number;
  total_students?: number;
  total_confirmed_users?: number;
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
    return <div className="animate-pulse flex space-x-4">
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-[var(--surface-light)] rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-[var(--surface-light)] rounded col-span-2"></div>
            <div className="h-2 bg-[var(--surface-light)] rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-[var(--surface-light)] rounded"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8" role="main" aria-label="Admin Dashboard Overview">
      <header>
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-black">
          {['admin', 'root_admin'].includes(user?.role || '') ? 'Global Platform Statistics' : `Statistics for ${stats?.school_name || 'your dashboard'}`}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Quick Stats">
        {['admin', 'root_admin'].includes(user?.role || '') && (
          <article className="glass-card p-6 border-l-4 border-l-secondary-500 rounded-xl" aria-label="Total Schools metric">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-black font-medium">Total Schools</h3>
              <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-400" aria-hidden="true">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.total_schools || 0}</p>
          </article>
        )}

        <article className="glass-card p-6 border-l-4 border-l-primary-500 rounded-xl" aria-label="Total Students metric">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-black font-medium">Total Users</h3>
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400" aria-hidden="true">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats?.total_students || 0}</p>
        </article>
      </section>

      {['admin', 'root_admin'].includes(user?.role || '') && stats && (
        <section className="glass-card p-6 rounded-xl mt-8" aria-label="User Statistics Chart">
          <h2 className="text-xl font-bold mb-6 text-foreground">User Verification Status</h2>
          <div className="h-[300px] w-full">
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
