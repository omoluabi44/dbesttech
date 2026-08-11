import client from './client';
import {
  PaginatedResponse,
  Subject,
  Topic,
  PracticeStartResponse,
  PracticeStageSubmitResponse,
  PracticeSession,
  PastQuestionFilters,
  PastQuestionStartResponse,
  PastQuestionSession,
} from '../types/quiz';

// General
export const getSubjects = async (): Promise<PaginatedResponse<Subject>> => {
  const res = await client.get('/quiz/subjects/');
  return res.data;
};

export const getTopics = async (subjectId: number): Promise<PaginatedResponse<Topic>> => {
  const res = await client.get(`/quiz/subjects/${subjectId}/topics/`);
  return res.data;
};

// Practice API
export const startPractice = async (data: { subject_id: number; level: string; difficulty: string }): Promise<PracticeStartResponse> => {
  const res = await client.post('/quiz/practice/start/', data);
  return res.data;
};

export const submitPracticeStage = async (
  sessionId: number,
  data: { stage: number; answers: { question_id: string; selected_answer: string }[] }
): Promise<PracticeStageSubmitResponse> => {
  const res = await client.post(`/quiz/practice/sessions/${sessionId}/submit-stage/`, data);
  return res.data;
};

export const getPracticeResults = async (sessionId: number) => {
  const res = await client.get(`/quiz/practice/sessions/${sessionId}/results/`);
  return res.data;
};

export const retryPractice = async (sessionId: number): Promise<PracticeStartResponse> => {
  const res = await client.post(`/quiz/practice/sessions/${sessionId}/retry/`);
  return res.data;
};

// Past Question API
export const getPastQuestionFilters = async (params: { subject_id?: number; level?: string }): Promise<PastQuestionFilters> => {
  const res = await client.get('/quiz/past-questions/filters/', { params });
  return res.data;
};

export const startPastQuestion = async (data: {
  subject_id: number;
  level: string;
  exam_body: string;
  year: number;
}): Promise<PastQuestionStartResponse> => {
  const res = await client.post('/quiz/past-questions/start/', data);
  return res.data;
};

export const submitPastQuestionAnswers = async (
  sessionId: number,
  answers: { question_id: string | number; selected_answer: string; time_spent_seconds: number }[]
): Promise<{ status: string }> => {
  const res = await client.post(`/quiz/past-questions/sessions/${sessionId}/submit/`, answers);
  return res.data;
};

export const completePastQuestion = async (sessionId: number): Promise<PastQuestionSession> => {
  const res = await client.post(`/quiz/past-questions/sessions/${sessionId}/complete/`);
  return res.data;
};

export const getPracticeReview = async (sessionId: number): Promise<any[]> => {
  const res = await client.get('/quiz/practice/sessions/' + sessionId + '/review/');
  return res.data;
};

export const getPastQuestionReview = async (sessionId: number): Promise<import('../types/quiz').PastQuestionAnswerReview[]> => {
  const res = await client.get('/quiz/past-questions/sessions/' + sessionId + '/review/');
  return res.data;
};

// Admin AI Endpoints
export const uploadPastQuestionsForAI = async (formData: FormData) => {
  const res = await client.post('/quiz/admin/ai/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const checkAIUploadStatus = async (uploadId: number) => {
  const res = await client.get(`/quiz/admin/ai/upload/${uploadId}/status/`);
  return res.data;
};

export const generateQuizWithAI = async (data: {
  subject_id: number;
  topic_id?: number | null;
  level: string;
  difficulty: string;
  num_questions: number;
  prompt: string;
}) => {
  const res = await client.post('/quiz/admin/ai/generate/', data);
  return res.data;
};

export const checkAIGenerationStatus = async (taskId: string) => {
  const res = await client.get(`/quiz/admin/ai/generate/${taskId}/status/`);
  return res.data;
};

export const bulkSaveAIQuiz = async (data: {
  questions: any[];
  subject_id: number;
  topic_id?: number | null;
  level: string;
  difficulty: string;
}) => {
  const res = await client.post('/quiz/admin/ai/bulk-save/', data);
  return res.data;
};

export const getAdminQuestions = async (params: any) => {
  const res = await client.get('/quiz/admin/questions/', { params });
  return res.data;
};
