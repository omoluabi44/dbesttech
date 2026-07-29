import client from './client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserWithProfile,
  StudentProfile,
  ChangePasswordRequest,
} from '../types/auth';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await client.post('/auth/login/', data);
  return res.data;
};

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const res = await client.post('/auth/register/', data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await client.post('/auth/logout/');
};

export const getProfile = async (): Promise<UserWithProfile> => {
  const res = await client.get('/auth/user/');
  return res.data;
};

export const getStudentProfile = async (): Promise<StudentProfile> => {
  const res = await client.get('/auth/student-profile/');
  return res.data;
};

export const updateStudentProfile = async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
  const res = await client.patch('/auth/student-profile/', data);
  return res.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await client.post('/auth/change-password/', data);
};
