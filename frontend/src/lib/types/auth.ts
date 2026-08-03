export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher' | 'admin';
  subscription_plan?: 'free' | 'basic' | 'premium';
  subscription_status?: 'active' | 'expired' | 'cancelled';
  quizzes_taken_today?: number;
  daily_quiz_limit?: number;
}

export interface StudentProfile {
  id: number;
  school_name: string;
  school_category: 'primary' | 'junior_secondary' | 'senior_secondary';
  category_display: string;
  level: string;
  level_display: string;
  is_graduating: boolean;
  date_of_birth: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile extends User {
  student_profile: StudentProfile;
  subscription_plan?: 'free' | 'basic' | 'premium';
  subscription_status?: 'active' | 'expired' | 'cancelled';
  quizzes_taken_today?: number;
  daily_quiz_limit?: number;
}

export interface LoginResponse {
  message: string;
  user: UserWithProfile;
  token: string;
}

export interface RegisterResponse extends LoginResponse {}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_confirm?: string;
  level: string;
  school_name?: string;
}

export interface ChangePasswordRequest {
  old_password?: string;
  new_password?: string;
  new_password_confirm?: string;
}
