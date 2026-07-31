import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  BarChart3, 
  Settings, 
  LogOut,
  BrainCircuit,
  Gamepad2,
  Star
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSchoolCategory } from '@/lib/hooks/useSchoolCategory';
import { logout } from '@/lib/api/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const Sidebar: React.FC<{ 
  isOpen: boolean; 
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}> = ({ isOpen, setIsOpen, isMobile }) => {
  const pathname = usePathname();
  const { clearAuth } = useAuthStore();
  const { isGraduating } = useSchoolCategory();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Performance', href: '/performance', icon: <BarChart3 size={20} /> },
    { label: 'Quiz History', href: '/quiz/history', icon: <History size={20} /> },
  ];

  if (isGraduating) {
    navItems.splice(1, 0, { 
      label: 'Past Questions', 
      href: '/past-questions', 
      icon: <BrainCircuit size={20} />
    });
  } else {
    navItems.splice(1, 0, { 
      label: 'Subjects', 
      href: '/subjects', 
      icon: <BookOpen size={20} />
    });
  }

  const bottomItems = [
    { label: 'Settings', href: '/profile', icon: <Settings size={20} /> },
  ];

  const sidebarVariants: import('framer-motion').Variants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? "closed" : "open"}
        animate={isMobile ? (isOpen ? "open" : "closed") : "open"}
        variants={sidebarVariants}
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-surface border-r-4 border-surface-dark flex flex-col transition-all shadow-xl md:shadow-none ${!isMobile && !isOpen ? 'md:-translate-x-full' : ''}`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b-4 border-surface-dark shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group w-full">
            <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-110 transition-transform shadow-cartoon">
              <Gamepad2 size={22} />
            </div>
            <span className="text-xl font-extrabold text-foreground tracking-tight">DBestQuiz</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <p className="px-3 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
            Main Menu
          </p>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all font-bold ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 border-b-2 border-primary-dark' 
                    : 'text-slate-600 hover:bg-primary-light hover:text-primary-dark hover:translate-x-1'
                }`}
              >
                <span className="text-slate-500">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-star"
                    className="ml-auto"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  </motion.div>
                )}
              </Link>
            );
          })}

          {/* Quick Play Button */}
          <Link
            href={isGraduating ? "/past-questions" : "/quiz/setup"}
            onClick={() => isMobile && setIsOpen(false)}
            className="mt-4 mx-1"
          >
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-primary text-white px-4 py-3 rounded-2xl font-extrabold text-center border-b-4 border-primary-dark transition-shadow flex justify-center items-center gap-2"
            >
              {isGraduating ? <BrainCircuit size={20} /> : <Gamepad2 size={20} />}
              {isGraduating ? 'Past Questions' : 'Start Quiz!'}
            </motion.div>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t-4 border-surface-dark shrink-0 flex flex-col gap-1">
          {bottomItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors font-bold ${
                pathname === item.href 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-slate-500">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors mt-1 font-bold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

      </motion.aside>
    </>
  );
};
