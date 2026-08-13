'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UserPlus, MoreVertical, CheckCircle, Trash2, Eye, X, Mail, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SCHOOL_CATEGORIES, SCHOOL_LEVELS } from '@/lib/utils/constants';
import { useAuthStore } from '@/lib/stores/authStore';

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

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  
  // Add form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    level: '',
    role: 'student', // default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/auth/admin-students/?page=${page}${roleFilter ? `&role=${roleFilter}` : ''}`);
      if (res.data && Array.isArray(res.data.results)) {
        setUsers(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10)); // Assuming page size 10
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
        setTotalPages(1);
      } else {
        setUsers([]);
      }
    } catch (err) {
      toast.error('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Depending on backend, we might need a separate endpoint or just pass role if backend allows
      // For now, auth/admin-students supports creation.
      await api.post('/auth/admin-students/', formData);
      toast.success('User created successfully!');
      setIsAddModalOpen(false);
      setFormData({
        first_name: '', last_name: '', username: '', email: '', 
        password: '', password_confirm: '', level: '', role: 'student'
      });
      fetchUsers();
    } catch (error: any) {
      let msg = 'Failed to create user.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) {
          msg = data.detail;
        } else if (data.non_field_errors) {
          msg = data.non_field_errors[0];
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey])) {
            msg = `${firstKey}: ${data[firstKey][0]}`;
          } else if (typeof data[firstKey] === 'string') {
            msg = `${firstKey}: ${data[firstKey]}`;
          }
        }
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: number) => {
    if (!confirm('Are you sure you want to manually verify this user\'s email?')) return;
    try {
      await api.post(`/auth/admin-students/${id}/verify/`);
      toast.success('User email verified successfully.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to verify user.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/auth/admin-students/${id}/`);
      toast.success('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const handleMakeAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) return;
    try {
      await api.post(`/auth/admin-students/${id}/make_admin/`);
      toast.success('User promoted to admin successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.status || 'Failed to promote user');
    }
  };

  return (
    <div className="space-y-6 relative" role="main" aria-label="Manage Users">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <div className="flex items-center gap-4">
          <select 
            aria-label="Filter by role"
            className="bg-[var(--surface-light)] border border-[var(--surface-dark)] text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2" aria-label="Add User">
            <UserPlus size={18} />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Users Table">
            <thead>
              <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)]">
                <th scope="col" className="p-4 font-medium text-gray-400">Name</th>
                <th scope="col" className="p-4 font-medium text-gray-400">Email</th>
                <th scope="col" className="p-4 font-medium text-gray-400">Role/Level</th>
                <th scope="col" className="p-4 font-medium text-gray-400 text-center">Verified</th>
                <th scope="col" className="p-4 font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--surface-light)] transition-colors focus-within:bg-[var(--surface-light)]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold" aria-hidden="true">
                          {user.first_name?.[0] || user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 capitalize">
                      {user.role === 'student' ? user.student_profile?.level_display || 'Student' : user.role.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-center">
                      {user.email_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400" aria-label="Verified">
                          <CheckCircle size={12} className="mr-1" aria-hidden="true" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400" aria-label="Pending Verification">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewUser(user)} className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded" aria-label={`View details for ${user.username}`} title="View Details">
                          <Eye size={18} aria-hidden="true" />
                        </button>
                        {!user.email_verified && (
                          <button onClick={() => handleVerify(user.id)} className="p-2 text-gray-400 hover:text-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded" aria-label={`Verify email for ${user.username}`} title="Verify Email">
                            <CheckCircle size={18} aria-hidden="true" />
                          </button>
                        )}
                        {currentUser?.role === 'root_admin' && user.role !== 'admin' && user.role !== 'root_admin' && (
                          <button onClick={() => handleMakeAdmin(user.id)} className="p-2 text-gray-400 hover:text-primary-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded" aria-label={`Make ${user.username} admin`} title="Promote to Admin">
                            <ShieldAlert size={18} aria-hidden="true" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded" aria-label={`Delete user ${user.username}`} title="Delete User">
                          <Trash2 size={18} aria-hidden="true" />
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
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-[var(--surface-dark)] flex items-center justify-between">
            <span className="text-sm text-gray-400" aria-live="polite">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded bg-[var(--surface-light)] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-[var(--surface-dark)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Previous Page"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded bg-[var(--surface-light)] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-[var(--surface-dark)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Next Page"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
              <h2 id="add-user-title" className="text-xl font-bold text-foreground">Add New User</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded" aria-label="Close modal">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  <Input label="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div>
                  <label htmlFor="role-select" className="text-sm font-medium text-slate-300 block mb-1.5">Role</label>
                  <select
                    id="role-select"
                    required
                    className="w-full bg-[var(--surface-light)] border border-[var(--surface-dark)] text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="student">Student</option>
                    {currentUser?.role === 'root_admin' && (
                      <option value="admin">Admin</option>
                    )}
                  </select>
                </div>
                {formData.role === 'student' && (
                  <div>
                    <label htmlFor="level-select" className="text-sm font-medium text-slate-300 block mb-1.5">Class Level</label>
                    <select
                      id="level-select"
                      required
                      className="w-full bg-[var(--surface-light)] border border-[var(--surface-dark)] text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
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
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  <Input label="Confirm Password" type="password" value={formData.password_confirm} onChange={e => setFormData({...formData, password_confirm: e.target.value})} required />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Create User</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="view-user-title">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
              <h2 id="view-user-title" className="text-xl font-bold text-foreground">User Details</h2>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded" aria-label="Close modal">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-2xl" aria-hidden="true">
                  {viewUser.first_name?.[0] || viewUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewUser.first_name} {viewUser.last_name}</h3>
                  <p className="text-gray-400">@{viewUser.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface-light)] p-4 rounded-xl border border-[var(--surface-dark)]">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" aria-hidden="true" />
                    {viewUser.email}
                  </p>
                </div>
                <div className="bg-[var(--surface-light)] p-4 rounded-xl border border-[var(--surface-dark)]">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Role</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 capitalize">{viewUser.role.replace('_', ' ')}</p>
                </div>
                {viewUser.role === 'student' && (
                  <div className="bg-[var(--surface-light)] p-4 rounded-xl border border-[var(--surface-dark)]">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Class Level</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{viewUser.student_profile?.level_display || 'N/A'}</p>
                  </div>
                )}
                <div className="bg-[var(--surface-light)] p-4 rounded-xl border border-[var(--surface-dark)]">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Status</p>
                  <p className="text-sm flex items-center gap-1">
                    {viewUser.email_verified ? (
                      <span className="text-green-400"><CheckCircle size={14} className="inline mr-1" aria-hidden="true" /> Verified</span>
                    ) : (
                      <span className="text-yellow-400">Pending</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={() => setViewUser(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
