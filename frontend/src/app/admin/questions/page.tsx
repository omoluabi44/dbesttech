'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Search, Filter, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import client from '@/lib/api/client';
import { getSubjects, getAdminQuestions } from '@/lib/api/quiz';
import { Subject } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [importType, setImportType] = useState<'quizzes' | 'past_questions'>('quizzes');
  
  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // List State
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ count: 0, next: null as string | null, previous: null as string | null, current: 1 });
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    subject_id: '',
    level: '',
    difficulty: '',
    is_practice: '',
    is_past_question: ''
  });

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
    fetchQuestions();
  }, []);

  const fetchQuestions = async (pageUrl?: string) => {
    try {
      setIsLoading(true);
      
      // If fetching a specific page URL, use it directly (extract params)
      // Otherwise, build from filters
      let endpoint = '/quiz/admin/questions/';
      let params = { ...filters };
      
      if (pageUrl) {
        const url = new URL(pageUrl);
        endpoint = url.pathname;
        const urlParams = Object.fromEntries(url.searchParams);
        params = { ...params, ...urlParams };
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });

      const res = await client.get(endpoint, { params });
      setQuestions(res.data.results);
      setPagination({
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        current: pageUrl ? (pageUrl.includes('page=') ? parseInt(new URL(pageUrl).searchParams.get('page') || '1') : 1) : 1
      });
    } catch (error) {
      toast.error('Failed to load questions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchQuestions();
    }
  }, [filters, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a CSV file first.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = importType === 'quizzes' 
      ? '/quiz/admin/quizzes/import/' 
      : '/quiz/admin/past-questions/import/';

    try {
      const response = await client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ type: 'success', text: response.data.message || 'Upload successful!' });
      setFile(null); // Clear file after success
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorText = error.response.data.error || 'Upload failed.';
        const details = error.response.data.details ? ` \nDetails: ${error.response.data.details.join(', ')}` : '';
        setMessage({ type: 'error', text: errorText + details });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await client.delete(`/quiz/admin/questions/${id}/`);
        toast.success('Question deleted successfully.');
        fetchQuestions();
      } catch (error) {
        toast.error('Failed to delete question.');
      }
    }
  };

  const handleEditClick = (q: any) => {
    // Deep copy to avoid mutating state directly
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      await client.patch(`/quiz/admin/questions/${editingQuestion.id}/`, {
        questionText: editingQuestion.questionText,
        correct_answer: editingQuestion.correct_answer,
        incorrect_answers: editingQuestion.incorrect_answers,
        explanation: editingQuestion.explanation
      });
      toast.success('Question updated successfully.');
      setIsEditModalOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to update question.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Question Bank</h1>
          <p className="text-gray-500 mt-1">Manage and import questions across all subjects and levels.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-xl overflow-hidden shadow-xl">
        
        {/* Tabs */}
        <div className="flex border-b border-[var(--surface-dark)]">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-300 ${
              activeTab === 'list'
                ? 'bg-primary-500/10 text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-primary-600 hover:bg-primary-500/10'
            }`}
          >
            Question List
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-300 ${
              activeTab === 'import'
                ? 'bg-primary-500/10 text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-primary-600 hover:bg-primary-500/10'
            }`}
          >
            Bulk Import CSV
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select name="subject_id" value={filters.subject_id} onChange={handleFilterChange} className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-3 py-2 text-foreground focus:border-primary-500 outline-none">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select name="level" value={filters.level} onChange={handleFilterChange} className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-3 py-2 text-foreground focus:border-primary-500 outline-none">
                <option value="">All Levels</option>
                {SCHOOL_LEVELS.map(lvl => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
              <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange} className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-3 py-2 text-foreground focus:border-primary-500 outline-none">
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select name="is_practice" value={filters.is_practice} onChange={handleFilterChange} className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-3 py-2 text-foreground focus:border-primary-500 outline-none">
                <option value="">Any Type</option>
                <option value="true">Practice Quiz</option>
                <option value="false">Not Practice</option>
              </select>
              <select name="is_past_question" value={filters.is_past_question} onChange={handleFilterChange} className="bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-3 py-2 text-foreground focus:border-primary-500 outline-none">
                <option value="">Any Source</option>
                <option value="true">Past Questions</option>
                <option value="false">Not Past Questions</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[var(--surface-dark)] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-dark)] text-gray-400 text-sm">
                    <th className="p-4 font-medium">Question Text</th>
                    <th className="p-4 font-medium w-32">Type</th>
                    <th className="p-4 font-medium w-32">Correct Answer</th>
                    <th className="p-4 font-medium w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)]">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></td></tr>
                  ) : questions.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No questions found matching your filters.</td></tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q.id} className="hover:bg-[var(--background)] transition-colors">
                        <td className="p-4 text-foreground text-sm max-w-md truncate">{q.questionText}</td>
                        <td className="p-4 text-gray-400 text-sm">{q.questionType === 'mcq' ? 'Multiple Choice' : 'Theory'}</td>
                        <td className="p-4 text-green-400 font-medium text-sm">{q.correct_answer}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => handleEditClick(q)} className="text-gray-400 hover:text-primary-400 transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(q.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && pagination.count > 0 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-gray-500">
                  Showing page {pagination.current} of {Math.ceil(pagination.count / 10) || 1} ({pagination.count} total)
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={!pagination.previous}
                    onClick={() => fetchQuestions(pagination.previous!)}
                    className="p-2 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg text-gray-400 hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={!pagination.next}
                    onClick={() => fetchQuestions(pagination.next!)}
                    className="p-2 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg text-gray-400 hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Bulk Import Tab */
          <div className="p-8">
            <div className="max-w-xl mx-auto">
              
              <div className="flex justify-center mb-6">
                <div className="bg-[var(--background)] p-1 rounded-lg flex border border-[var(--surface-dark)]">
                  <button 
                    onClick={() => setImportType('quizzes')} 
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${importType === 'quizzes' ? 'bg-[var(--surface-dark)] text-foreground' : 'text-gray-500'}`}
                  >
                    Practice Quizzes
                  </button>
                  <button 
                    onClick={() => setImportType('past_questions')} 
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${importType === 'past_questions' ? 'bg-[var(--surface-dark)] text-foreground' : 'text-gray-500'}`}
                  >
                    Past Questions
                  </button>
                </div>
              </div>

              <div className="mb-6 text-center">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Upload {importType === 'quizzes' ? 'Practice Quizzes' : 'Past Questions'} CSV
                </h3>
                <p className="text-sm text-gray-500">
                  Please ensure your CSV file follows the correct template format. 
                  Incorrect answers should be separated into columns: 
                  <code className="bg-gray-800 text-primary-300 px-2 py-0.5 rounded mx-1 text-xs">incorrect_answer_1</code>, 
                  <code className="bg-gray-800 text-primary-300 px-2 py-0.5 rounded mx-1 text-xs">incorrect_answer_2</code>, etc.
                </p>
              </div>

              <div className="relative group">
                <label 
                  htmlFor="file-upload" 
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    file 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-[var(--surface-dark)] bg-[var(--surface-light)] hover:bg-gray-800 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                        <p className="mb-2 text-sm text-[var(--foreground)] font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-primary-500 mb-3 transition-colors" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold text-[var(--foreground)]">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">CSV files only</p>
                      </>
                    )}
                  </div>
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {message && (
                <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`mt-6 w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                  !file || isUploading
                    ? 'bg-[var(--surface-dark)] text-gray-500 cursor-not-allowed'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading & Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Import Questions
                  </>
                )}
              </button>
              
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[var(--surface-dark)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Edit Question</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Question Text</label>
                <textarea 
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({...editingQuestion, questionText: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Correct Answer</label>
                <input 
                  type="text"
                  value={editingQuestion.correct_answer}
                  onChange={(e) => setEditingQuestion({...editingQuestion, correct_answer: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-green-400 focus:border-primary-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Incorrect Answers</label>
                <div className="space-y-2">
                  {Object.entries(editingQuestion.incorrect_answers || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <span className="text-gray-500 w-6">{key}.</span>
                      <input 
                        type="text"
                        value={value as string}
                        onChange={(e) => {
                          const newIncorrect = { ...editingQuestion.incorrect_answers, [key]: e.target.value };
                          setEditingQuestion({...editingQuestion, incorrect_answers: newIncorrect});
                        }}
                        className="flex-1 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-2 text-foreground focus:border-primary-500 outline-none"
                      />
                    </div>
                  ))}
                  {/* For array-based incorrect answers if some models use arrays */}
                  {Array.isArray(editingQuestion.incorrect_answers) && editingQuestion.incorrect_answers.map((ans: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-gray-500">{idx + 1}.</span>
                      <input 
                        type="text"
                        value={ans}
                        onChange={(e) => {
                          const newArr = [...editingQuestion.incorrect_answers];
                          newArr[idx] = e.target.value;
                          setEditingQuestion({...editingQuestion, incorrect_answers: newArr});
                        }}
                        className="flex-1 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-2 text-foreground focus:border-primary-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Explanation</label>
                <textarea 
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[var(--surface-dark)] flex justify-end gap-3 bg-[var(--surface-light)] rounded-b-2xl">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
