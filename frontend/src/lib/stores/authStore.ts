import { create } from 'zustand';
import { UserWithProfile } from '../types/auth';

interface AuthState {
  user: UserWithProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPrimary: boolean;
  setAuth: (user: UserWithProfile, token: string) => void;
  updateUser: (user: UserWithProfile) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isPrimary: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    const isPrimary = user.student_profile?.level.startsWith('primary') || false;
    set({ user, token, isAuthenticated: true, isPrimary, isLoading: false });
  },

  updateUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    const isPrimary = user.student_profile?.level.startsWith('primary') || false;
    set({ user, isPrimary });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    set({ user: null, token: null, isAuthenticated: false, isPrimary: false, isLoading: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as UserWithProfile;
          const isPrimary = user.student_profile?.level.startsWith('primary') || false;
          set({ user, token, isAuthenticated: true, isPrimary, isLoading: false });
          return;
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }
    }
    set({ isLoading: false });
  },
}));
