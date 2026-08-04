'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, UserPlus, TrendingUp, Activity } from 'lucide-react';

interface Stats {
  total_schools?: number;
  total_students?: number;
  school_name?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock historical data for charts
  const growthData = [
    { name: 'Jan', students: 400, admins: 10 },
    { name: 'Feb', students: 600, admins: 12 },
    { name: 'Mar', students: 800, admins: 15 },
    { name: 'Apr', students: 1100, admins: 15 },
    { name: 'May', students: 1500, admins: 18 },
    { name: 'Jun', students: 2000, admins: 20 },
  ];

  const roleDistribution = [
    { name: 'Students', value: stats?.total_students || 2000 },
    { name: 'Admins', value: 20 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user) {
          // You could have a specific analytics endpoint here
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
    return <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-[var(--surface-light)] rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--surface-light)] rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-[var(--surface-light)] rounded-xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8" role="main" aria-label="Analytics Dashboard">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-black">
            Platform usage and growth metrics
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-primary-500 rounded-xl" aria-label="Total Students">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-black font-medium">Total Students</h3>
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black">{stats?.total_students || 0}</p>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +12% this month
          </p>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-secondary-500 rounded-xl" aria-label="New Signups">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-black font-medium">New Signups (7d)</h3>
            <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-400">
              <UserPlus className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black">142</p>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +5% vs last week
          </p>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-amber-500 rounded-xl" aria-label="Active Users">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-black font-medium">Active Users (24h)</h3>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black">856</p>
          <p className="text-sm text-black mt-2">Currently online: 45</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl" aria-label="User Growth Chart">
          <h3 className="text-xl font-bold mb-6">User Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} name="Students" />
                <Line type="monotone" dataKey="admins" stroke="#10b981" strokeWidth={3} name="Admins" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl" aria-label="User Roles Distribution">
          <h3 className="text-xl font-bold mb-6">Role Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
