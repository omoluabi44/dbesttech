'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, MoreVertical, CheckCircle, Trash2, Eye, X, Mail } from 'lucide-react';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SCHOOL_CATEGORIES, SCHOOL_LEVELS } from '@/lib/utils/constants';

interface StudentProfile {
  level_display: string;
  category_display: string;
  level: string;
  school_category: string;
  date_of_birth: string | null;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: boolean;
  student_profile: StudentProfile;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<User | null>(null);
  
  // Add form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    level: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/admin-students/');
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await api.post('/accounts/admin-students/', formData);
      toast.success('Student created successfully!');
      setIsAddModalOpen(false);
      setFormData({
        first_name: '', last_name: '', username: '', email: '', 
        password: '', password_confirm: '', level: ''
      });
      fetchStudents();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Failed to create student.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: number) => {
    if (!confirm('Are you sure you want to manually verify this user\'s email?')) return;
    try {
      await api.post(`/accounts/admin-students/${id}/verify/`);
      toast.success('User email verified successfully.');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to verify user.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to delete this student? This action cannot be undone.')) return;
    try {
      await api.delete(`/accounts/admin-students/${id}/`);
      toast.success('Student deleted successfully.');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student.');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Students</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <UserPlus size={18} />
          <span>Add Student</span>
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)]">
                <th className="p-4 font-medium text-gray-400">Name</th>
                <th className="p-4 font-medium text-gray-400">Email</th>
                <th className="p-4 font-medium text-gray-400">Level</th>
                <th className="p-4 font-medium text-gray-400 text-center">Verified</th>
                <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                          {student.first_name?.[0] || student.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">@{student.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{student.email}</td>
                    <td className="p-4 text-gray-300">{student.student_profile?.level_display}</td>
                    <td className="p-4 text-center">
                      {student.email_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                          <CheckCircle size={12} className="mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewStudent(student)} className="p-2 text-gray-400 hover:text-white transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                        {!student.email_verified && (
                          <button onClick={() => handleVerify(student.id)} className="p-2 text-gray-400 hover:text-green-400 transition-colors" title="Verify Email">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete Student">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Add New Student</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  <Input label="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Class Level</label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                    value={formData.level}
                    onChange={e => setFormData({...formData, level: e.target.value})}
                  >
                    <option value="" disabled>Select a level</option>
                    {SCHOOL_CATEGORIES.map(category => (
                      <optgroup key={category.value} label={category.label}>
                        {SCHOOL_LEVELS.filter(l => l.category === category.value).map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  <Input label="Confirm Password" type="password" value={formData.password_confirm} onChange={e => setFormData({...formData, password_confirm: e.target.value})} required />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Create Student</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Student Details</h2>
              <button onClick={() => setViewStudent(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-2xl">
                  {viewStudent.first_name?.[0] || viewStudent.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{viewStudent.first_name} {viewStudent.last_name}</h3>
                  <p className="text-gray-400">@{viewStudent.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-gray-200 flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    {viewStudent.email}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Class Level</p>
                  <p className="text-sm text-gray-200">{viewStudent.student_profile?.level_display}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Status</p>
                  <p className="text-sm flex items-center gap-1">
                    {viewStudent.email_verified ? (
                      <span className="text-green-400"><CheckCircle size={14} className="inline mr-1" /> Verified</span>
                    ) : (
                      <span className="text-yellow-400">Pending Verification</span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Joined Date</p>
                  <p className="text-sm text-gray-200">{new Date(viewStudent.student_profile?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={() => setViewStudent(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
