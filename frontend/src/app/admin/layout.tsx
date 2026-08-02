'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, FileText, BarChart, GraduationCap, BrainCircuit, UploadCloud } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user && !['root_admin', 'school_admin', 'admin'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ...(['admin', 'root_admin'].includes(user.role)
      ? [
          { name: 'AI Quiz Gen', href: '/admin/ai-generate', icon: BrainCircuit },
          { name: 'Upload PQ', href: '/admin/ai-upload', icon: UploadCloud },
          { name: 'User Management', href: '/admin/users', icon: Users },
        ]
      : []),
    { name: 'Question Bank', href: '/admin/questions', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[var(--surface)] border-r border-[var(--surface-dark)] hidden md:flex flex-col" aria-label="Admin Sidebar">
          <div className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="DBestQuiz Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-secondary-400">
                Admin Panel
              </h2>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {['admin', 'root_admin'].includes(user.role) ? 'Root Administrator' : 'Administrator'}
            </p>
          </div>
          <nav className="flex-1 px-4 space-y-2" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-gray-500 hover:text-primary-500 hover:bg-primary-500/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[var(--surface-dark)]">
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
