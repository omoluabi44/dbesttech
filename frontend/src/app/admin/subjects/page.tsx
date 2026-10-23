'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  BookOpen, 
  BrainCircuit, 
  Search, 
  X, 
  Check, 
  Filter, 
  GraduationCap, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getAdminSubjects, createSubject, updateSubject, deleteSubject } from '@/lib/api/quiz';
import { Subject } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    applicable_levels: string[];
    is_active: boolean;
    all_levels: boolean;
  }>({
    name: '',
    description: '',
    applicable_levels: [],
    is_active: true,
    all_levels: true,
  });

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (levelFilter) params.level = levelFilter;
      if (statusFilter !== '') params.is_active = statusFilter;

      const res = await getAdminSubjects(params);
      const list = Array.isArray(res) ? res : res.results || [];
      setSubjects(list);
    } catch (error) {
      console.error('Failed to load subjects', error);
      toast.error('Failed to load subjects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [levelFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateClick = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      applicable_levels: [],
      is_active: true,
      all_levels: true,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (s: Subject) => {
    setEditingSubject(s);
    const levels = s.applicable_levels || [];
    const isAll = levels.length === 0 || levels.length === SCHOOL_LEVELS.length;
    setFormData({
      name: s.name,
      description: s.description || '',
      applicable_levels: levels,
      is_active: s.is_active ?? true,
      all_levels: isAll,
    });
    setIsModalOpen(true);
  };

  const handleLevelToggle = (lvlVal: string) => {
    setFormData(prev => {
      const exists = prev.applicable_levels.includes(lvlVal);
      const next = exists 
        ? prev.applicable_levels.filter(l => l !== lvlVal)
        : [...prev.applicable_levels, lvlVal];
      return {
        ...prev,
        applicable_levels: next,
        all_levels: next.length === SCHOOL_LEVELS.length || next.length === 0,
      };
    });
  };

  const handleAllLevelsToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      all_levels: checked,
      applicable_levels: checked ? [] : SCHOOL_LEVELS.map(l => l.value),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        applicable_levels: formData.all_levels ? [] : formData.applicable_levels,
        is_active: formData.is_active,
      };

      if (editingSubject) {
        await updateSubject(editingSubject.id, payload);
        toast.success(`Subject "${formData.name}" updated successfully.`);
      } else {
        await createSubject(payload);
        toast.success(`Subject "${formData.name}" created successfully! Available for study and AI quiz generation.`);
      }

      setIsModalOpen(false);
      fetchSubjects();
    } catch (error: any) {
      const msg = error?.response?.data?.name?.[0] || 
                  error?.response?.data?.error || 
                  'Failed to save subject.';
      toast.error(msg);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSubject(subjectToDelete.id);
      toast.success(`Subject "${subjectToDelete.name}" deleted.`);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject. It might have linked questions or topics.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevelBadgeText = (levels?: string[]) => {
    if (!levels || levels.length === 0 || levels.length === SCHOOL_LEVELS.length) {
      return 'All Class Levels';
    }
    if (levels.length <= 3) {
      return levels.map(l => {
        const found = SCHOOL_LEVELS.find(sl => sl.value === l);
        return found ? found.label : l;
      }).join(', ');
    }
    return `${levels.length} Class Levels`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <BookOpen className="text-primary-500 w-8 h-8" />
            Subject Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Create and manage curriculum subjects so students can study them and you can generate quizzes with AI.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-primary hover:bg-[var(--primary-hover)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all whitespace-nowrap"
        >
          <Plus size={18} />
          Create New Subject
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--surface-dark)] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search subjects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Class Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">🌐 All School Levels</option>
              {SCHOOL_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Stats summary strip */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--surface-dark)] pt-3 text-xs text-gray-500 font-medium">
          <span>Total Subjects: <strong className="text-foreground">{subjects.length}</strong></span>
          {(searchQuery || levelFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setLevelFilter('');
                setStatusFilter('');
              }}
              className="text-primary-500 font-bold hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Subjects Grid / Table */}
      <div className="glass-card rounded-2xl border border-[var(--surface-dark)] shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <span className="text-sm font-medium text-gray-400">Loading subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto">
              <BookOpen size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No subjects found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery || levelFilter || statusFilter
                  ? 'No subjects matched your filter criteria.'
                  : 'Get started by creating your first subject for students to study and practice.'}
              </p>
            </div>
            {!searchQuery && !levelFilter && !statusFilter && (
              <button
                onClick={handleCreateClick}
                className="bg-primary hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create Subject
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--surface-dark)] bg-[var(--surface-light)] text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="p-4">Subject</th>
                  <th className="p-4">Applicable Levels</th>
                  <th className="p-4 text-center">Topics</th>
                  <th className="p-4 text-center">Questions</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                {subjects.map((sub) => {
                  const isAllLevels = !sub.applicable_levels || sub.applicable_levels.length === 0;
                  return (
                    <tr key={sub.id} className="hover:bg-[var(--surface-light)]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center flex-shrink-0">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block text-base">{sub.name}</span>
                            {sub.description && (
                              <p className="text-xs text-gray-500 line-clamp-1 max-w-md mt-0.5">{sub.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isAllLevels
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                        }`}>
                          <GraduationCap size={13} />
                          {getLevelBadgeText(sub.applicable_levels)}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-foreground">
                        <Link
                          href={`/admin/topics?subject_id=${sub.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary-500 hover:underline px-2.5 py-1 rounded-lg bg-[var(--surface-light)]"
                          title="View Topics"
                        >
                          <Layers size={13} />
                          <span>{sub.topics_count ?? 0} topics</span>
                        </Link>
                      </td>
                      <td className="p-4 text-center font-bold text-foreground">
                        <span className="text-xs text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg bg-[var(--surface-light)]">
                          {sub.quizzes_count ?? 0} questions
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sub.is_active !== false
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-rose-500/15 text-rose-500'
                        }`}>
                          {sub.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/ai-generate`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-bold transition-all shadow-sm"
                            title={`Generate AI Quiz for ${sub.name}`}
                          >
                            <BrainCircuit size={13} />
                            <span className="hidden sm:inline">AI Quiz</span>
                          </Link>
                          <button
                            onClick={() => handleEditClick(sub)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-dark)] text-gray-500 hover:text-foreground transition-all"
                            title="Edit Subject"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setSubjectToDelete(sub)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 transition-all"
                            title="Delete Subject"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--surface-dark)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-500 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingSubject ? 'Update subject details and level availability.' : 'Add a new subject for students to study and quiz.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-foreground hover:bg-[var(--surface-dark)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biology, Chemistry, Civic Education, Economics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the subject curriculum..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Applicable School Levels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Applicable School Levels
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-primary-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.all_levels}
                      onChange={(e) => handleAllLevelsToggle(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500"
                    />
                    <span>All School Levels (General)</span>
                  </label>
                </div>

                {!formData.all_levels ? (
                  <div className="p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-dark)] max-h-48 overflow-y-auto space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {SCHOOL_LEVELS.map((lvl) => {
                        const isChecked = formData.applicable_levels.includes(lvl.value);
                        return (
                          <label
                            key={lvl.value}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                              isChecked
                                ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                                : 'hover:bg-[var(--surface-dark)] text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleLevelToggle(lvl.value)}
                              className="rounded text-primary-500 focus:ring-primary-500"
                            />
                            <span>{lvl.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-[var(--surface-light)] p-2.5 rounded-xl border border-[var(--surface-dark)]">
                    This subject applies to all student class levels (Primary 1 to SSS 3).
                  </p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>Active (Visible to students for study & practice)</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--surface-dark)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-[var(--surface-dark)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-[var(--primary-hover)] text-white shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingSubject ? 'Save Changes' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground">Delete Subject?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong className="text-foreground">{subjectToDelete.name}</strong>?
                This may permanently remove or orphan topics and questions mapped to this subject.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-[var(--surface-dark)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                <span>Delete Subject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
