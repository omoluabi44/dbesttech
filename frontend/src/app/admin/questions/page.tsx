'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Search, Filter, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import client from '@/lib/api/client';
import { 
  getSubjects, 
  getAdminQuestions,
  getAdminPastQuestions,
  createPastQuestion,
  updatePastQuestion,
  deletePastQuestion,
  getPastQuestionPresignedUrl,
  removePastQuestionImage
} from '@/lib/api/quiz';
import { Subject } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { toast } from 'sonner';

const EXAM_BODY_OPTIONS = [
  { value: 'waec', label: 'WAEC' },
  { value: 'neco', label: 'NECO' },
  { value: 'jamb', label: 'JAMB' },
  { value: 'gce', label: 'GCE' },
  { value: 'nabteb', label: 'NABTEB' },
  { value: 'bece', label: 'BECE' },
  { value: 'federal_common_entrance', label: 'Federal Common Entrance' },
  { value: 'state_common_entrance', label: 'State Common Entrance' },
];

const uploadToS3 = (uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
};

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
  const [listSource, setListSource] = useState<'all' | 'practice' | 'past_questions'>('all');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Image Upload Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalQuestion, setImageModalQuestion] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  

  // Filters
  const [filters, setFilters] = useState({
    subject_id: '',
    level: '',
    difficulty: ''
  });

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
    fetchQuestions();
  }, [listSource]); // Re-fetch when list source changes

  const fetchQuestions = async (pageUrl?: string) => {
    try {
      setIsLoading(true);
      
      let endpoint = listSource === 'past_questions' ? '/quiz/admin/past-questions/' : '/quiz/admin/questions/';
      let params: any = { ...filters };
      
      if (listSource === 'practice') {
        params.is_practice = 'true';
      }

      if (pageUrl) {
        const url = new URL(pageUrl, window.location.origin);
        endpoint = url.pathname.replace(/^\/api\//, '/');
        const urlParams = Object.fromEntries(url.searchParams);
        params = { ...params, ...urlParams };
      }
      
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const res = await client.get(endpoint, { params });
      setQuestions(res.data.results);
      setPagination({
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        current: pageUrl ? (pageUrl.includes('page=') ? parseInt(new URL(pageUrl, window.location.origin).searchParams.get('page') || '1') : 1) : 1
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
  
  const handleDelete = async (id: string, isPastQuestion: boolean) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        if (listSource === 'past_questions' || isPastQuestion) {
          await deletePastQuestion(id);
        } else {
          await client.delete(`/quiz/admin/questions/${id}/`);
        }
        toast.success('Question deleted successfully.');
        fetchQuestions();
      } catch (error) {
        toast.error('Failed to delete question.');
      }
    }
  };

  const handleEditClick = (q: any) => {
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      if (listSource === 'past_questions' || editingQuestion.is_past_question) {
        await updatePastQuestion(editingQuestion.id, {
          questionText: editingQuestion.questionText,
          correct_answer: editingQuestion.correct_answer,
          incorrect_answers: editingQuestion.incorrect_answers,
          explanation: editingQuestion.explanation
        });
      } else {
        await client.patch(`/quiz/admin/questions/${editingQuestion.id}/`, {
          questionText: editingQuestion.questionText,
          correct_answer: editingQuestion.correct_answer,
          incorrect_answers: editingQuestion.incorrect_answers,
          explanation: editingQuestion.explanation
        });
      }
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

  const handleOpenImageModal = (q: any) => {
    setImageModalQuestion(q);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setIsImageModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !imageModalQuestion) return;
    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      // Get presigned url
      const { upload_url, image_url } = await getPastQuestionPresignedUrl({
        question_id: imageModalQuestion.id,
        filename: imageFile.name,
        content_type: imageFile.type
      });

      // Upload to S3
      await uploadToS3(upload_url, imageFile, (pct) => setUploadProgress(pct));

      // Update question with image_url
      await updatePastQuestion(imageModalQuestion.id, { image_url });

      toast.success('Image uploaded successfully');
      setIsImageModalOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to upload image');
      console.error(err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async (q: any) => {
    if (!window.confirm('Remove image?')) return;
    try {
      await removePastQuestionImage(q.id);
      toast.success('Image removed');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to remove image');
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

        {activeTab === 'list' && (
          <div className="p-6">
            {/* List Source Toggle */}
            <div className="mb-6 flex gap-2 p-1 bg-[var(--surface-dark)] rounded-lg w-fit">
              <button 
                onClick={() => setListSource('all')} 
                className={`px-4 py-2 text-sm rounded-md transition-colors ${listSource === 'all' ? 'bg-[var(--surface)] text-foreground shadow' : 'text-gray-400'}`}
              >
                Source: All
              </button>
              <button 
                onClick={() => setListSource('practice')} 
                className={`px-4 py-2 text-sm rounded-md transition-colors ${listSource === 'practice' ? 'bg-[var(--surface)] text-foreground shadow' : 'text-gray-400'}`}
              >
                Practice Quiz
              </button>
              <button 
                onClick={() => setListSource('past_questions')} 
                className={`px-4 py-2 text-sm rounded-md transition-colors ${listSource === 'past_questions' ? 'bg-[var(--surface)] text-foreground shadow' : 'text-gray-400'}`}
              >
                Past Questions
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[var(--surface-dark)] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-dark)] text-gray-400 text-sm">
                    <th className="p-4 font-medium">Question Text</th>
                    <th className="p-4 font-medium w-32">Type</th>
                    <th className="p-4 font-medium w-32">Correct Answer</th>
                    <th className="p-4 font-medium w-64 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)]">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></td></tr>
                  ) : questions.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No questions found matching your filters.</td></tr>
                  ) : (
                    questions.map((q) => {
                      const isPastQuestion = listSource === 'past_questions' || q.is_past_question;
                      return (
                        <tr key={q.id} className="hover:bg-[var(--background)] transition-colors">
                          <td className="p-4 text-foreground text-sm max-w-md">
                            <div className="flex items-start gap-2">
                              {q.image_url && (
                                <img src={q.image_url} alt="img" className="w-8 h-8 rounded border border-gray-200 object-cover mt-1" />
                              )}
                              <div className="truncate">{q.questionText}</div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">{q.questionType === 'mcq' ? 'Multiple Choice' : 'Theory'}</td>
                          <td className="p-4 text-green-400 font-medium text-sm">{q.correct_answer}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              {isPastQuestion && (
                                <>
                                  <button 
                                    onClick={() => handleOpenImageModal(q)} 
                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                  >
                                    {q.image_url ? 'Change Image' : 'Add Image'}
                                  </button>
                                  {q.image_url && (
                                    <button 
                                      onClick={() => handleRemoveImage(q)}
                                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium transition-colors underline"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </>
                              )}
                              <button onClick={() => handleEditClick(q)} className="text-gray-600 dark:text-gray-400 hover:text-[var(--primary)] transition-colors" title="Edit">
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(q.id, isPastQuestion)} className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
        )}
        
        {activeTab === 'import' && (
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

      {/* Image Upload Modal */}
      {isImageModalOpen && imageModalQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-[var(--surface-dark)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Upload Image</h2>
              <button onClick={() => setIsImageModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 text-sm text-gray-400 line-clamp-2">
                {imageModalQuestion.questionText}
              </div>

              <div className="relative group mb-6">
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${imageFile ? 'border-primary-500/50 bg-primary-500/5' : 'border-[var(--surface-dark)] bg-[var(--surface-light)] hover:bg-gray-800'}`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-[var(--foreground)]">Click to browse</span>
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP up to 5MB</p>
                    </div>
                  )}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageFileChange} />
                </label>
              </div>

              {isUploadingImage && uploadProgress > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button
                onClick={handleImageUpload}
                disabled={!imageFile || isUploadingImage}
                className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  !imageFile || isUploadingImage ? 'bg-[var(--surface-dark)] text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                }`}
              >
                {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[var(--surface-dark)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Edit Question</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-2xl leading-none">&times;</button>
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
                className="px-6 py-2.5 text-[var(--foreground)] hover:bg-[var(--surface-dark)] rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-black rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
