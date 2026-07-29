'use client';

import React from 'react';
import { Menu, Bell, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { Avatar } from '../ui/Avatar';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { motion } from 'framer-motion';

export const Topbar: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}> = ({ isOpen, setIsOpen, isMobile }) => {
  const { user } = useAuthStore();
  const { toggleMute, isMuted } = useSoundEffects();

  return (
    <header className="h-16 bg-surface border-b-4 border-surface-dark flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Mute/Unmute Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={`p-2.5 rounded-full transition-colors border-2 ${
            isMuted 
              ? 'bg-red-50 text-red-400 border-red-200 hover:bg-red-100' 
              : 'bg-sky-50 text-sky-500 border-sky-200 hover:bg-sky-100'
          }`}
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </motion.button>

        {/* Notifications */}
        <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors relative border-2 border-transparent hover:border-slate-200">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-surface"></span>
        </button>
        
        {/* User Info */}
        <div className="flex items-center gap-3 pl-3 border-l-2 border-surface-dark">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-extrabold text-slate-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs font-bold text-slate-400">{user?.student_profile?.level_display}</p>
          </div>
          <Avatar 
            initials={user?.first_name?.charAt(0) || user?.username?.charAt(0) || '?'} 
            src={user?.student_profile?.avatar}
            className="border-3 border-primary-light ring-2 ring-primary/20"
          />
        </div>
      </div>
    </header>
  );
};
