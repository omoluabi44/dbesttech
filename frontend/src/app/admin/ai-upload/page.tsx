'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getSubjects, uploadPastQuestionsForAI, checkAIUploadStatus } from '@/lib/api/quiz';
import { Subject } from '@/types/quiz';
import { UploadCloud, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadForm {
  subject_id: number;
  level: string;
  exam_body: string;
  year: number;
}

export default function AIUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset } = useForm<UploadForm>();

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
  }, []);

  // Poll status when uploadId is set and status is processing/pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploadId && (status === 'pending' || status === 'processing' || status === null)) {
      interval = setInterval(async () => {
        try {
          const res = await checkAIUploadStatus(uploadId);
          setStatus(res.status);
          if (res.status === 'completed') {
            setExtractedCount(res.questions_extracted);
            toast.success(`Successfully extracted ${res.questions_extracted} questions!`);
            clearInterval(interval);
          } else if (res.status === 'failed') {
            setErrorMsg(res.error_message);
            toast.error('Failed to extract questions.');
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Status check failed", error);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadId, status]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(f.type)) {
        toast.error('Only PDF, JPEG, PNG, and WEBP files are allowed.');
        return;
      }
      setFile(f);
      // Reset state on new file
      setUploadId(null);
      setStatus(null);
    }
  };

  const onSubmit = async (data: UploadForm) => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', data.subject_id.toString());
      formData.append('level', data.level);
      formData.append('exam_body', data.exam_body);
      formData.append('year', data.year.toString());
      
      const res = await uploadPastQuestionsForAI(formData);
      setUploadId(res.id);
      setStatus('pending');
      toast.success('Upload successful! AI is now extracting questions.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setUploadId(null);
    setStatus(null);
    setExtractedCount(0);
    setErrorMsg('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
          <UploadCloud className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Past Questions</h1>
          <p className="text-gray-400">Upload a PDF or Image of a past exam and AI will automatically extract and save the questions.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl p-6 md:p-8">
        
        {uploadId ? (
          // Status Tracker View
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            {(status === 'pending' || status === 'processing' || status === null) && (
              <>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--surface-dark)] border-t-primary-500 animate-spin mx-auto"></div>
                  <BrainCircuit className="w-8 h-8 text-primary-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">AI is Processing Document</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    The AI is currently reading the document, identifying questions, options, and correct answers. 
                    This usually takes 1-3 minutes depending on the document length. Please don't close this page.
                  </p>
                </div>
              </>
            )}
            
            {status === 'completed' && (
              <>
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Extraction Complete!</h3>
                  <p className="text-gray-400 mb-6 text-lg">
                    Successfully extracted <span className="text-white font-bold">{extractedCount}</span> questions.
                  </p>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                  >
                    Upload Another Document
                  </button>
                </div>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Extraction Failed</h3>
                  <p className="text-red-400 max-w-md mx-auto mb-6 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                    {errorMsg || "An unknown error occurred during extraction."}
                  </p>
                  <button 
                    onClick={() => { setUploadId(null); setStatus(null); }}
                    className="px-6 py-2.5 bg-[var(--surface-dark)] hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Upload Form View
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                <select 
                  {...register('subject_id', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Class Level</label>
                <select 
                  {...register('level', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Level...</option>
                  <option value="primary_1">Primary 1</option>
                  <option value="primary_2">Primary 2</option>
                  <option value="primary_3">Primary 3</option>
                  <option value="primary_4">Primary 4</option>
                  <option value="primary_5">Primary 5</option>
                  <option value="primary_6">Primary 6</option>
                  <option value="jss_1">JSS 1</option>
                  <option value="jss_2">JSS 2</option>
                  <option value="jss_3">JSS 3</option>
                  <option value="ss_1">SS 1</option>
                  <option value="ss_2">SS 2</option>
                  <option value="ss_3">SS 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Exam Body</label>
                <select 
                  {...register('exam_body', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Exam Body...</option>
                  <option value="federal_common_entrance">Federal Common Entrance</option>
                  <option value="state_common_entrance">State Common Entrance</option>
                  <option value="bece">BECE</option>
                  <option value="waec">WAEC</option>
                  <option value="gce">GCE</option>
                  <option value="neco">NECO</option>
                  <option value="nabteb">NABTEB</option>
                  <option value="jamb">JAMB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
                <input 
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  {...register('year', { required: true })}
                  placeholder="e.g., 2023"
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Document File (PDF or Image)</label>
              
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${file ? 'border-primary-500 bg-primary-500/5' : 'border-[var(--surface-dark)] hover:border-gray-500 bg-[var(--background)]'}`}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={onFileChange} 
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-[var(--surface-dark)] rounded-full flex items-center justify-center mb-4">
                    {file ? <FileText className="w-8 h-8 text-primary-400" /> : <UploadCloud className="w-8 h-8 text-gray-400" />}
                  </div>
                  {file ? (
                    <>
                      <h4 className="text-lg font-medium text-white mb-1">{file.name}</h4>
                      <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <span className="text-primary-500 text-sm mt-3 font-medium hover:underline">Change File</span>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-medium text-white mb-1">Click to browse</h4>
                      <p className="text-sm text-gray-400 max-w-sm">
                        Upload a scanned PDF or clear images of the past questions. The AI will read the text automatically.
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--surface-dark)] flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !file}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg font-medium shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Upload & Extract</>
                )}
              </button>
            </div>
          </form>
        )}
        
      </div>
    </div>
  );
}
