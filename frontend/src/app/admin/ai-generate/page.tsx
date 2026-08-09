'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getSubjects, getTopics, generateQuizWithAI, bulkSaveAIQuiz, checkAIGenerationStatus } from '@/lib/api/quiz';
import { Subject, Topic } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { BrainCircuit, Loader2, Save, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateForm {
  subject_id: number;
  topic_id?: number;
  level: string;
  difficulty: string;
  num_questions: number;
  prompt: string;
}

interface AIQuestion {
  question_text: string;
  explanation: string;
  options: { label: string; text: string; is_correct: boolean }[];
}

export default function AIGeneratePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // For editing a question
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AIQuestion | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<GenerateForm>({
    defaultValues: {
      difficulty: 'medium',
      num_questions: 5,
    }
  });

  const selectedSubjectId = watch('subject_id');

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      getTopics(selectedSubjectId).then(res => setTopics(res.results)).catch(console.error);
    } else {
      setTopics([]);
    }
  }, [selectedSubjectId]);

  const onSubmit = async (data: GenerateForm) => {
    try {
      setIsGenerating(true);
      const res = await generateQuizWithAI(data);
      
      if (res.task_id) {
        // Start polling
        const taskId = res.task_id;
        
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await checkAIGenerationStatus(taskId);
            
            if (statusRes.status === 'completed') {
              clearInterval(pollInterval);
              setGeneratedQuestions(statusRes.questions);
              toast.success(`Generated ${statusRes.questions.length} questions successfully!`);
              setIsGenerating(false);
            } else if (statusRes.status === 'failed') {
              clearInterval(pollInterval);
              toast.error(statusRes.error || 'Failed to generate questions. Please try again.');
              setIsGenerating(false);
            }
            // If pending/processing, do nothing and wait for next poll
          } catch (err: any) {
            clearInterval(pollInterval);
            toast.error('Lost connection while generating questions.');
            setIsGenerating(false);
          }
        }, 3000); // poll every 3 seconds
      } else if (Array.isArray(res)) {
        // Fallback if backend is still synchronous
        setGeneratedQuestions(res);
        toast.success(`Generated ${res.length} questions successfully!`);
        setIsGenerating(false);
      } else {
        toast.error('Failed to generate questions. Please try again.');
        setIsGenerating(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initiate question generation');
      setIsGenerating(false);
    }
  };

  const handleBulkSave = async () => {
    const data = watch();
    if (!data.subject_id || !data.level) {
      toast.error('Subject and Level are required.');
      return;
    }
    
    try {
      setIsSaving(true);
      const res = await bulkSaveAIQuiz({
        questions: generatedQuestions,
        subject_id: Number(data.subject_id),
        topic_id: data.topic_id ? Number(data.topic_id) : null,
        level: data.level,
        difficulty: data.difficulty,
      });
      toast.success(res.message || 'Questions saved to question bank!');
      setGeneratedQuestions([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save questions');
    } finally {
      setIsSaving(false);
    }
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm(JSON.parse(JSON.stringify(generatedQuestions[index])));
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm) {
      setGeneratedQuestions(prev => {
        const newArr = [...prev];
        newArr[editingIndex] = editForm;
        return newArr;
      });
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Quiz Generator</h1>
          <p className="text-gray-400">Generate high-quality multiple choice questions instantly using Gemini AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Generation Settings</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                <select 
                  {...register('subject_id', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Topic (Optional)</label>
                <select 
                  {...register('topic_id')}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Any Topic (Mixed)</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Class Level</label>
                <select 
                  {...register('level', { required: true })}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Level...</option>
                  {SCHOOL_LEVELS.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                  <select 
                    {...register('difficulty')}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Count</label>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    {...register('num_questions', { required: true, min: 1, max: 100 })}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Custom Prompt</label>
                <textarea 
                  {...register('prompt')}
                  placeholder="E.g., Focus on WAEC standard questions about Osmosis in plant cells..."
                  rows={4}
                  className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                ) : (
                  <><BrainCircuit className="w-5 h-5" /> Generate Questions</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          {generatedQuestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-dark)]">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Preview Generated Questions</h3>
                  <p className="text-sm text-gray-400">{generatedQuestions.length} questions drafted. Review and edit before saving.</p>
                </div>
                <button
                  onClick={handleBulkSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save to Database
                </button>
              </div>

              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-xl p-5">
                    {editingIndex === idx ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <textarea
                          value={editForm?.question_text}
                          onChange={(e) => setEditForm(prev => prev ? {...prev, question_text: e.target.value} : null)}
                          className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground"
                          rows={3}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          {editForm?.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name={`edit_correct_${idx}`} 
                                checked={opt.is_correct}
                                onChange={() => {
                                  setEditForm(prev => {
                                    if (!prev) return prev;
                                    const newOpts = prev.options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                                    return { ...prev, options: newOpts };
                                  });
                                }}
                                className="w-4 h-4 text-primary-500"
                              />
                              <span className="text-gray-400 font-bold">{opt.label}.</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  setEditForm(prev => {
                                    if (!prev) return prev;
                                    const newOpts = [...prev.options];
                                    newOpts[oIdx].text = e.target.value;
                                    return { ...prev, options: newOpts };
                                  });
                                }}
                                className="flex-1 bg-[var(--background)] border border-[var(--surface-dark)] rounded p-2 text-sm text-foreground"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Explanation</label>
                          <input
                            type="text"
                            value={editForm?.explanation}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, explanation: e.target.value} : null)}
                            className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded p-2 text-sm text-gray-600 dark:text-gray-300"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingIndex(null)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                          <button onClick={saveEdit} className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-400">Done</button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-foreground font-medium text-lg leading-relaxed pr-8">
                            <span className="text-primary-500 mr-2">{idx + 1}.</span> 
                            {q.question_text}
                          </h4>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => startEdit(idx)} className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeQuestion(idx)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-3 rounded-lg border ${opt.is_correct ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--background)] border-[var(--surface-dark)]'} flex items-center gap-3`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-[var(--surface-dark)] text-gray-400'}`}>
                                {opt.label}
                              </div>
                              <span className={opt.is_correct ? 'text-green-400' : 'text-gray-600 dark:text-gray-300'}>{opt.text}</span>
                              {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--surface-dark)]">
                          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1 block">Explanation</span>
                          <p className="text-sm text-gray-400">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-[var(--surface-dark)] rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <BrainCircuit className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Questions Generated Yet</h3>
              <p className="text-gray-500 max-w-sm">
                Use the form on the left to configure your requirements, and our AI will draft high-quality educational questions for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
