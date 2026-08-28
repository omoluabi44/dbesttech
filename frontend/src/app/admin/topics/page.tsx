'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getSubjects, getAdminTopics, createTopic, updateTopic, deleteTopic } from '@/lib/api/quiz';
import { Subject } from '@/lib/types/quiz';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ count: 0, next: null as string | null, previous: null as string | null, current: 1 });
  
  // Filters
  const [filters, setFilters] = useState({
    subject_id: '',
    level: '',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    name: '',
    level: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.results)).catch(console.error);
    fetchTopics();
  }, []);

  const fetchTopics = async (pageUrl?: string) => {
    try {
      setIsLoading(true);
      let params: any = { ...filters };
      let page = 1;

      if (pageUrl) {
        const url = new URL(pageUrl, window.location.origin);
        const urlParams = Object.fromEntries(url.searchParams);
        params = { ...params, ...urlParams };
        page = parseInt(url.searchParams.get('page') || '1');
      }
      
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const res = await getAdminTopics(params);
      setTopics(res.results);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
        current: page
      });
    } catch (error) {
      toast.error('Failed to load topics.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateClick = () => {
    setEditingTopic(null);
    setFormData({
      subject: filters.subject_id || (subjects[0]?.id.toString() || ''),
      name: '',
      level: filters.level || SCHOOL_LEVELS[0].value,
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (t: any) => {
    setEditingTopic(t);
    setFormData({
      subject: t.subject.toString(),
      name: t.name,
      level: t.level,
      description: t.description || '',
      is_active: t.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this topic? It may affect existing questions.')) {
      try {
        await deleteTopic(id);
        toast.success('Topic deleted successfully.');
        fetchTopics();
      } catch (error) {
        toast.error('Failed to delete topic.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.level) {
      toast.error('Name, Subject, and Level are required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        subject: parseInt(formData.subject),
        name: formData.name,
        level: formData.level,
        description: formData.description,
        is_active: formData.is_active
      };

      if (editingTopic) {
        await updateTopic(editingTopic.id, payload);
        toast.success('Topic updated successfully.');
      } else {
        await createTopic(payload);
        toast.success('Topic created successfully.');
      }
      setIsModalOpen(false);
      fetchTopics();
    } catch (error: any) {
      toast.error(error?.response?.data?.name?.[0] || error?.response?.data?.error || 'Failed to save topic.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Topic Management</h1>
          <p className="text-gray-500 mt-1">Manage topics mapped to specific subjects and school levels.</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Topic
        </button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-xl overflow-hidden shadow-xl p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-[var(--surface-dark)] rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-dark)] text-gray-400 text-sm">
                <th className="p-4 font-medium">Topic Name</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Level</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></td></tr>
              ) : topics.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No topics found matching your filters.</td></tr>
              ) : (
                topics.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--background)] transition-colors">
                    <td className="p-4 text-foreground text-sm font-medium">{t.name}</td>
                    <td className="p-4 text-gray-400 text-sm">{t.subject_name}</td>
                    <td className="p-4 text-gray-400 text-sm">{t.level_display}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEditClick(t)} className="text-gray-600 dark:text-gray-400 hover:text-[var(--primary)] transition-colors" title="Edit">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-5 h-5" />
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
                onClick={() => fetchTopics(pagination.previous!)}
                className="p-2 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg text-gray-400 hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={!pagination.next}
                onClick={() => fetchTopics(pagination.next!)}
                className="p-2 bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg text-gray-400 hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] rounded-2xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[var(--surface-dark)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                  <select 
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Level</label>
                  <select 
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                  >
                    {SCHOOL_LEVELS.map(lvl => (
                      <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Topic Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Fractions and Decimals"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--surface-dark)] rounded-lg p-3 text-foreground focus:border-primary-500 outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-primary-600 bg-[var(--background)] border-[var(--surface-dark)] rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-400">
                    Active (visible to students)
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--surface-dark)] flex justify-end gap-3 bg-[var(--surface-light)] rounded-b-2xl">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-[var(--foreground)] hover:bg-[var(--surface-dark)] rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-black rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
