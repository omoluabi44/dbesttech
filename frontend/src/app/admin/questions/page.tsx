'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import client from '@/lib/api/client';

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'past_questions'>('quizzes');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    const endpoint = activeTab === 'quizzes' 
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Question Bank</h1>
          <p className="text-gray-500 mt-1">Bulk upload questions using CSV files.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-xl overflow-hidden shadow-xl">
        
        {/* Tabs */}
        <div className="flex border-b border-[var(--surface-dark)]">
          <button
            onClick={() => { setActiveTab('quizzes'); setMessage(null); setFile(null); }}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-300 ${
              activeTab === 'quizzes'
                ? 'bg-primary-500/10 text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-primary-600 hover:bg-primary-500/10'
            }`}
          >
            Practice Quizzes
          </button>
          <button
            onClick={() => { setActiveTab('past_questions'); setMessage(null); setFile(null); }}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-300 ${
              activeTab === 'past_questions'
                ? 'bg-secondary-500/10 text-secondary-600 border-b-2 border-secondary-500'
                : 'text-gray-500 hover:text-secondary-600 hover:bg-secondary-500/10'
            }`}
          >
            Past Questions
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-8">
          <div className="max-w-xl mx-auto">
            
            <div className="mb-6 text-center">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Upload {activeTab === 'quizzes' ? 'Practice Quizzes' : 'Past Questions'} CSV
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
      </div>
    </div>
  );
}
