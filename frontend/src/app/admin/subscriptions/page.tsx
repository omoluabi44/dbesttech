'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, CheckCircle, X, Trash2 } from 'lucide-react';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  price: string;
  currency: string;
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  order: number;
  start_date?: string;
  end_date?: string;
}

export default function SubscriptionsAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  // Add/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    price: '',
    currency: 'NGN',
    is_featured: false,
    is_active: true,
    order: 0,
    features: '', // We'll manage features as a newline separated string in the UI
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/admin-subscriptions/');
      if (res.data && Array.isArray(res.data.results)) {
        setPlans(res.data.results);
      } else if (Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        setPlans([]);
      }
    } catch (err) {
      toast.error('Failed to load subscription plans.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Add Modal removed as requested

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      price: plan.price,
      currency: plan.currency || 'NGN',
      is_featured: plan.is_featured,
      is_active: plan.is_active,
      order: plan.order,
      features: (plan.features || []).join('\n'),
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        features: formData.features.split('\n').map(f => f.trim()).filter(f => f),
      };

      if (editingPlan) {
        await api.put(`/auth/admin-subscriptions/${editingPlan.id}/`, payload);
        toast.success('Plan updated successfully!');
      }
      
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to save plan.';
      toast.error(msg);
      console.error(error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete function removed as requested

  return (
    <div className="space-y-6 relative" role="main" aria-label="Manage Subscriptions">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Manage Subscriptions</h1>
      </div>

      <div className="glass-card rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Plans Table">
            <thead>
              <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)]">
                <th scope="col" className="p-4 font-medium text-black">Plan Name</th>
                <th scope="col" className="p-4 font-medium text-black">Price</th>
                <th scope="col" className="p-4 font-medium text-black text-center">Active</th>
                <th scope="col" className="p-4 font-medium text-black text-center">Featured</th>
                <th scope="col" className="p-4 font-medium text-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-black">
                    Loading plans...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-black">
                    No subscription plans found.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4">
                      <p className="text-foreground font-medium">{plan.display_name}</p>
                      <p className="text-sm text-black font-mono">{plan.name}</p>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {plan.price === '0.00' ? 'Free' : `₦${parseFloat(plan.price).toLocaleString()}`}
                    </td>
                    <td className="p-4 text-center">
                      {plan.name === 'holiday-package' ? (
                        plan.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                            <CheckCircle size={12} className="mr-1" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                            <X size={12} className="mr-1" /> No
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-black">Always Active</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {plan.is_featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(plan)} className="p-2 text-black hover:text-gray-900 dark:hover:text-white transition-colors">
                          <Edit2 size={18} />
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
              <h2 className="text-xl font-bold text-foreground">Edit Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-black hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Internal Code Name (e.g. basic)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required disabled={!!editingPlan} />
                  <Input label="Display Name (e.g. Premium)" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Price (NGN)" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  <Input label="Display Order (0 is first)" type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} required />
                </div>
                
                {formData.name === 'holiday-package' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Date (Optional)" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                    <Input label="End Date (Optional)" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                )}
                
                <div className="flex gap-6 pt-2">
                  {formData.name === 'holiday-package' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded bg-[var(--surface-dark)] border-[var(--surface-dark)] text-primary-500 focus:ring-primary-500" />
                      <span className="text-sm text-foreground">Active (Visible to users)</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="rounded bg-[var(--surface-dark)] border-[var(--surface-dark)] text-primary-500 focus:ring-primary-500" />
                    <span className="text-sm text-foreground">Featured (Highlight on frontend)</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Features (One per line)</label>
                  <textarea
                    required
                    className="w-full bg-[var(--surface-light)] border border-[var(--surface-dark)] text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 min-h-[100px]"
                    value={formData.features}
                    onChange={e => setFormData({...formData, features: e.target.value})}
                    placeholder="Access to all subjects\nDetailed explanations\nPriority support"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Save Plan</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
