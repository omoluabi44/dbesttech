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
  const res = await client.get('/auth/profile/');
  return res.data;
};

export const getStudentProfile = async (): Promise<StudentProfile> => {
  const res = await client.get('/auth/student-profile/');
  return res.data;
};

export const updateStudentProfile = async (data: Partial<StudentProfile> | FormData): Promise<StudentProfile> => {
  const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  const res = await client.patch('/auth/student-profile/', data, config);
  return res.data;
};

export const updateUser = async (data: { first_name?: string; last_name?: string }): Promise<UserWithProfile> => {
  const res = await client.patch('/auth/profile/', data);
  return res.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await client.post('/auth/change-password/', data);
};
