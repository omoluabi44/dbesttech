'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { getSubjects, uploadPastQuestionsForAI, checkAIUploadStatus } from '@/lib/api/quiz';
import { Subject } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { UploadCloud, Loader2, FileText, CheckCircle2, AlertCircle, BrainCircuit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadForm {
  subject_id: number;
  level: string;
  exam_body: string;
  year: number;
}

interface FileUpload {
  file: File;
  id?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  extractedCount: number;
  errorMsg: string;
}

export default function AIUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm<UploadForm>();

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
  }, []);

  // Poll status for all processing/pending uploads
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const pendingUploads = uploads.filter(u => u.id && (u.status === 'pending' || u.status === 'processing'));
    
    if (pendingUploads.length > 0) {
      interval = setInterval(async () => {
        const newUploads = [...uploads];
        let hasChanges = false;
        
        for (let i = 0; i < newUploads.length; i++) {
          const u = newUploads[i];
          if (u.id && (u.status === 'pending' || u.status === 'processing')) {
            try {
              const res = await checkAIUploadStatus(u.id);
              if (res.status !== u.status || res.questions_extracted !== u.extractedCount) {
                newUploads[i] = {
                  ...u,
                  status: res.status,
                  extractedCount: res.questions_extracted || 0,
                  errorMsg: res.error_message || ''
                };
                hasChanges = true;
                
                if (res.status === 'completed') {
                  toast.success(`Extracted ${res.questions_extracted} questions from ${u.file.name}!`);
                } else if (res.status === 'failed') {
                  toast.error(`Failed to extract questions from ${u.file.name}.`);
                }
              }
            } catch (error) {
              console.error("Status check failed for", u.file.name, error);
            }
          }
        }
        
        if (hasChanges) {
          setUploads(newUploads);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploads]);

  const handleFiles = (newFiles: FileList | File[]) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const validFiles: FileUpload[] = [];
    
    Array.from(newFiles).forEach(f => {
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name} is not supported. Only PDF, JPEG, PNG, and WEBP are allowed.`);
      } else {
        // Prevent duplicates by name and size
        if (!uploads.some(u => u.file.name === f.name && u.file.size === f.size)) {
          validFiles.push({
            file: f,
            status: null,
            extractedCount: 0,
            errorMsg: ''
          });
        }
      }
    });

    if (validFiles.length > 0) {
      setUploads(prev => [...prev, ...validFiles]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: UploadForm) => {
    const pendingFiles = uploads.filter(u => u.status === null || u.status === 'failed');
    
    if (pendingFiles.length === 0) {
      toast.error('Please add files to upload.');
      return;
    }
    
    setIsUploading(true);
    let allSuccess = true;
    
    const currentUploads = [...uploads];
    
    for (let i = 0; i < currentUploads.length; i++) {
      if (currentUploads[i].status === null || currentUploads[i].status === 'failed') {
        try {
          const formData = new FormData();
          formData.append('file', currentUploads[i].file);
          formData.append('subject', data.subject_id.toString());
          formData.append('level', data.level);
          formData.append('exam_body', data.exam_body);
          formData.append('year', data.year.toString());
          
          const res = await uploadPastQuestionsForAI(formData);
          currentUploads[i] = {
            ...currentUploads[i],
            id: res.id,
            status: 'pending'
          };
        } catch (error: any) {
          allSuccess = false;
          currentUploads[i] = {
            ...currentUploads[i],
            status: 'failed',
            errorMsg: error.response?.data?.error || 'Failed to upload document.'
          };
          toast.error(`Failed to upload ${currentUploads[i].file.name}`);
        }
      }
    }
    
    setUploads([...currentUploads]);
    setIsUploading(false);
    
    if (allSuccess) {
      toast.success('Uploads successful! AI is now extracting questions.');
    }
  };

  const handleReset = () => {
    reset();
    setUploads([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
          <UploadCloud className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Past Questions</h1>
          <p className="text-gray-400">Upload multiple PDFs or Images of past exams and AI will automatically extract and save the questions.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl p-6 md:p-8">
        
        {uploads.some(u => u.id !== undefined) && uploads.every(u => u.status === 'completed' || u.status === 'failed') ? (
          // Status Tracker View when ALL are done processing
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Extraction Complete!</h3>
              <div className="space-y-3 my-6 max-w-lg mx-auto text-left bg-[var(--background)] p-4 rounded-xl border border-[var(--surface-dark)] max-h-60 overflow-y-auto custom-scrollbar">
                {uploads.map((u, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--surface-dark)] last:border-0">
                    <span className="text-gray-300 truncate max-w-[200px]">{u.file.name}</span>
                    {u.status === 'completed' ? (
                      <span className="text-green-400 text-sm font-medium">{u.extractedCount} questions</span>
                    ) : (
                      <span className="text-red-400 text-sm font-medium">Failed</span>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={handleReset}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg font-medium transition-colors"
              >
                Upload More Documents
              </button>
            </div>
          </div>
        ) : (
          // Upload Form View
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                <select 
                  {...register('subject_id', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Class Level</label>
                <select 
                  {...register('level', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Level...</option>
                  {SCHOOL_LEVELS.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Exam Body</label>
                <select 
                  {...register('exam_body', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary-500"
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
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Document Files (PDFs or Images)</label>
              
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--surface-dark)] hover:border-gray-500 bg-[var(--background)]'}`}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  multiple
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={onFileChange} 
                  ref={fileInputRef}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full">
                  <div className="w-16 h-16 bg-[var(--surface-dark)] rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-primary-400" />
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-1">Click to browse or drag files here</h4>
                  <p className="text-sm text-gray-400 max-w-sm">
                    Upload multiple scanned PDFs or clear images of past questions.
                  </p>
                </label>
              </div>
            </div>
            
            {/* Display selected files */}
            {uploads.length > 0 && (
              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {uploads.map((u, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{u.file.name}</p>
                        <p className="text-xs text-gray-500">{(u.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {u.status === 'pending' || u.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-primary-400 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing
                        </div>
                      ) : u.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" /> {u.extractedCount} Qs
                        </div>
                      ) : u.status === 'failed' ? (
                        <div className="flex items-center gap-2 text-red-400 text-sm" title={u.errorMsg}>
                          <AlertCircle className="w-4 h-4" /> Failed
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[var(--surface-dark)] flex justify-end">
              <button
                type="submit"
                disabled={uploads.length === 0 || isUploading || uploads.some(u => u.status === 'pending' || u.status === 'processing')}
                className="px-8 py-3 bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading || uploads.some(u => u.status === 'pending' || u.status === 'processing') ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
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
