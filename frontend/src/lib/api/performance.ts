import client from './client';
import {
  PerformanceSummary,
  WeeklyProgress,
  StrengthWeakness,
  OverallPerformance,
} from '../types/performance';
import { PaginatedResponse } from '../types/quiz';

export const getOverallSummary = async (): Promise<OverallPerformance> => {
  const res = await client.get('/performance/summary/');
  return res.data;
};

export const getBySubject = async (): Promise<PaginatedResponse<PerformanceSummary>> => {
  const res = await client.get('/performance/by-subject/');
  return res.data;
};

export const getWeeklyProgress = async (): Promise<PaginatedResponse<WeeklyProgress>> => {
  const res = await client.get('/performance/weekly/');
  return res.data;
};

export const getStrengths = async (status?: string, subjectId?: string): Promise<PaginatedResponse<StrengthWeakness>> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (subjectId) params.append('subject_id', subjectId);
  
  const url = `/performance/strengths/?${params.toString()}`;
  const res = await client.get(url);
  return res.data;
};
